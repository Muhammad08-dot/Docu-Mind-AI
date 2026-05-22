"""
DocuMind AI - LLM Generation Service
Supports OpenAI and Ollama with anti-hallucination guardrails
"""
import re
import time
from typing import Tuple, Optional, List, Dict, Any
import structlog

from config import settings

logger = structlog.get_logger()


# System prompt with strict grounding instructions
SYSTEM_PROMPT = """You are DocuMind AI, an enterprise document assistant that provides accurate, verifiable answers.

CRITICAL INSTRUCTIONS:
1. Answer ONLY based on the provided context documents.
2. If the context does not contain enough information to answer the question, reply exactly with: "I don't know based on the provided documents."
3. Always cite your sources using [Source X] notation when referencing information.
4. Be precise and factual - do not make assumptions or add information not in the context.
5. If asked in Urdu, respond in Urdu. If asked in English, respond in English.
6. Format your answers clearly with bullet points or numbered lists when appropriate.
7. Never fabricate information, statistics, or quotes.

You are helpful, accurate, and always grounded in the provided documents."""

QUERY_TEMPLATE = """Based on the following context documents, answer the user's question.

CONTEXT:
{context}

---

USER QUESTION: {query}

INSTRUCTIONS:
- Only use information from the context above
- Cite sources as [Source 1], [Source 2], etc.
- If the answer is not in the context, say "I don't know based on the provided documents."

ANSWER:"""


class LLMService:
    """LLM service supporting multiple providers"""
    
    def __init__(self):
        self.provider = settings.LLM_PROVIDER
        self.client = None
        self._init_client()
    
    def _init_client(self):
        """Initialize the appropriate LLM client"""
        if self.provider == "openai":
            from openai import OpenAI
            self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
            self.model = settings.OPENAI_MODEL
            logger.info("Initialized OpenAI client", model=self.model)
        else:
            # Ollama uses HTTP API
            import httpx
            self.client = httpx.Client(base_url=settings.OLLAMA_BASE_URL, timeout=120.0)
            self.model = settings.OLLAMA_MODEL
            logger.info("Initialized Ollama client", model=self.model)
    
    def _call_openai(self, prompt: str) -> Tuple[str, int]:
        """Call OpenAI API"""
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            temperature=settings.LLM_TEMPERATURE,
            max_tokens=settings.LLM_MAX_TOKENS,
        )
        
        answer = response.choices[0].message.content
        tokens = response.usage.total_tokens
        
        return answer, tokens
    
    def _call_ollama(self, prompt: str) -> Tuple[str, int]:
        """Call Ollama API"""
        response = self.client.post(
            "/api/generate",
            json={
                "model": self.model,
                "prompt": f"{SYSTEM_PROMPT}\n\n{prompt}",
                "stream": False,
                "options": {
                    "temperature": settings.LLM_TEMPERATURE,
                    "num_predict": settings.LLM_MAX_TOKENS,
                }
            }
        )
        response.raise_for_status()
        data = response.json()
        
        answer = data.get("response", "")
        # Ollama doesn't always return token counts
        tokens = data.get("eval_count", 0) + data.get("prompt_eval_count", 0)
        
        return answer, tokens
    
    def generate(
        self,
        query: str,
        context: str,
        language: str = "en"
    ) -> Tuple[str, int, int]:
        """
        Generate answer based on query and context
        Returns: (answer, tokens_used, latency_ms)
        """
        start_time = time.time()
        
        # Build prompt
        prompt = QUERY_TEMPLATE.format(context=context, query=query)
        
        # Add language instruction if Urdu
        if language == "ur":
            prompt += "\n\nIMPORTANT: Respond in Urdu (اردو میں جواب دیں)"
        
        logger.info(
            "Generating response",
            provider=self.provider,
            query_length=len(query),
            context_length=len(context)
        )
        
        try:
            if self.provider == "openai":
                answer, tokens = self._call_openai(prompt)
            else:
                answer, tokens = self._call_ollama(prompt)
        except Exception as e:
            logger.error("LLM generation failed", error=str(e))
            raise
        
        latency_ms = int((time.time() - start_time) * 1000)
        
        logger.info(
            "Generation complete",
            tokens=tokens,
            latency_ms=latency_ms,
            answer_length=len(answer)
        )
        
        return answer, tokens, latency_ms
    
    def calculate_confidence(
        self,
        answer: str,
        context: str,
        sources: List[Dict[str, Any]]
    ) -> float:
        """
        Calculate confidence score based on:
        - Whether answer says "I don't know"
        - Source relevance scores
        - Answer length relative to context
        """
        # Check for explicit uncertainty
        uncertainty_phrases = [
            "i don't know",
            "i do not know",
            "cannot find",
            "not found in",
            "no information",
            "based on the provided documents",
            "مجھے نہیں معلوم",
            "معلومات نہیں"
        ]
        
        answer_lower = answer.lower()
        for phrase in uncertainty_phrases:
            if phrase in answer_lower:
                return 0.3  # Low confidence for uncertain answers
        
        # Base confidence from source scores
        if sources:
            avg_relevance = sum(s.get("relevance_score", 0) for s in sources) / len(sources)
            base_confidence = min(0.95, avg_relevance)
        else:
            base_confidence = 0.5
        
        # Penalize very short answers
        if len(answer) < 50:
            base_confidence *= 0.8
        
        # Boost for citation presence
        citation_pattern = r'\[Source \d+\]'
        citations = re.findall(citation_pattern, answer)
        if citations:
            base_confidence = min(0.98, base_confidence + 0.05 * len(citations))
        
        return round(base_confidence, 2)


# Singleton instance
llm_service = LLMService()
