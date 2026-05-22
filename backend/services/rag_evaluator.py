"""
DocuMind AI - RAG Evaluation Service
Implements RAGAS-inspired metrics for evaluation
"""
import re
from typing import List, Dict, Any, Tuple
import structlog

from config import settings

logger = structlog.get_logger()


class RAGEvaluator:
    """
    Evaluates RAG pipeline quality using three key metrics:
    1. Context Precision - Are the retrieved chunks relevant?
    2. Faithfulness - Is the answer grounded in the context?
    3. Answer Relevance - Does the answer address the query?
    """
    
    def __init__(self, use_llm_judge: bool = False):
        """
        Args:
            use_llm_judge: If True, uses LLM for more accurate evaluation
                          If False, uses heuristic-based evaluation (faster)
        """
        self.use_llm_judge = use_llm_judge
        logger.info("Initialized RAGEvaluator", llm_judge=use_llm_judge)
    
    def _calculate_word_overlap(self, text1: str, text2: str) -> float:
        """Calculate Jaccard similarity between two texts"""
        words1 = set(re.findall(r'\w+', text1.lower()))
        words2 = set(re.findall(r'\w+', text2.lower()))
        
        if not words1 or not words2:
            return 0.0
        
        intersection = words1 & words2
        union = words1 | words2
        
        return len(intersection) / len(union)
    
    def evaluate_context_precision(
        self,
        query: str,
        retrieved_chunks: List[Dict[str, Any]],
        relevance_threshold: float = 0.3
    ) -> Tuple[float, Dict[str, Any]]:
        """
        Evaluate if the retrieved chunks are relevant to the query.
        
        Context Precision = (Number of relevant chunks) / (Total retrieved chunks)
        
        Returns:
            (score, details_dict)
        """
        if not retrieved_chunks:
            return 0.0, {"relevant_count": 0, "total_count": 0, "chunks": []}
        
        relevant_count = 0
        chunk_details = []
        
        for chunk in retrieved_chunks:
            content = chunk.get("content", chunk.get("text", ""))
            
            # Calculate relevance using word overlap
            relevance = self._calculate_word_overlap(query, content)
            is_relevant = relevance >= relevance_threshold
            
            if is_relevant:
                relevant_count += 1
            
            chunk_details.append({
                "chunk_id": chunk.get("chunk_id", "unknown"),
                "relevance_score": round(relevance, 3),
                "is_relevant": is_relevant
            })
        
        precision = relevant_count / len(retrieved_chunks)
        
        return round(precision, 3), {
            "relevant_count": relevant_count,
            "total_count": len(retrieved_chunks),
            "chunks": chunk_details
        }
    
    def evaluate_faithfulness(
        self,
        answer: str,
        context: str
    ) -> Tuple[float, Dict[str, Any]]:
        """
        Evaluate if the answer is grounded in the provided context.
        
        Faithfulness measures whether the answer contains information
        that can be found in the context (no hallucination).
        
        Returns:
            (score, details_dict)
        """
        if not answer or not context:
            return 0.0, {"grounded_sentences": 0, "total_sentences": 0}
        
        # Split answer into sentences
        sentences = re.split(r'[.!?]', answer)
        sentences = [s.strip() for s in sentences if s.strip() and len(s.strip()) > 10]
        
        if not sentences:
            return 1.0, {"grounded_sentences": 0, "total_sentences": 0}
        
        grounded_count = 0
        sentence_details = []
        
        for sentence in sentences:
            # Check if key words from sentence appear in context
            sentence_words = set(re.findall(r'\w+', sentence.lower()))
            context_words = set(re.findall(r'\w+', context.lower()))
            
            # Remove common words
            common_words = {'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
                          'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
                          'would', 'could', 'should', 'may', 'might', 'must', 'shall',
                          'and', 'or', 'but', 'if', 'then', 'else', 'when', 'where',
                          'which', 'who', 'whom', 'this', 'that', 'these', 'those',
                          'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'all',
                          'each', 'every', 'both', 'few', 'more', 'most', 'other',
                          'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
                          'so', 'than', 'too', 'very', 'can', 'just', 'also', 'for',
                          'with', 'from', 'to', 'of', 'in', 'on', 'at', 'by', 'as'}
            
            key_words = sentence_words - common_words
            
            if not key_words:
                grounded_count += 1
                continue
            
            # Calculate how many key words are in context
            overlap = key_words & context_words
            grounding_score = len(overlap) / len(key_words) if key_words else 0
            
            is_grounded = grounding_score >= 0.5
            if is_grounded:
                grounded_count += 1
            
            sentence_details.append({
                "sentence": sentence[:100] + "..." if len(sentence) > 100 else sentence,
                "grounding_score": round(grounding_score, 3),
                "is_grounded": is_grounded
            })
        
        faithfulness = grounded_count / len(sentences)
        
        return round(faithfulness, 3), {
            "grounded_sentences": grounded_count,
            "total_sentences": len(sentences),
            "details": sentence_details[:5]  # Limit details
        }
    
    def evaluate_answer_relevance(
        self,
        query: str,
        answer: str
    ) -> Tuple[float, Dict[str, Any]]:
        """
        Evaluate if the answer directly addresses the query.
        
        Returns:
            (score, details_dict)
        """
        if not query or not answer:
            return 0.0, {"overlap_score": 0}
        
        # Basic relevance: word overlap between query and answer
        base_overlap = self._calculate_word_overlap(query, answer)
        
        # Check for uncertainty phrases (lower relevance)
        uncertainty_phrases = [
            "i don't know", "i do not know", "cannot find",
            "not found", "no information", "unclear",
            "مجھے نہیں معلوم", "معلومات نہیں"
        ]
        
        answer_lower = answer.lower()
        has_uncertainty = any(phrase in answer_lower for phrase in uncertainty_phrases)
        
        # Penalize uncertain answers
        if has_uncertainty:
            relevance = base_overlap * 0.5
        else:
            relevance = min(1.0, base_overlap * 1.5 + 0.3)  # Boost confident answers
        
        # Check if answer is substantial
        answer_words = len(answer.split())
        if answer_words < 20:
            relevance *= 0.7  # Penalize very short answers
        
        return round(min(1.0, relevance), 3), {
            "overlap_score": round(base_overlap, 3),
            "has_uncertainty": has_uncertainty,
            "answer_length": answer_words
        }
    
    def evaluate_full(
        self,
        query: str,
        answer: str,
        retrieved_chunks: List[Dict[str, Any]],
        context: str
    ) -> Dict[str, Any]:
        """
        Run full RAG evaluation.
        
        Returns comprehensive evaluation results.
        """
        # Context Precision
        precision_score, precision_details = self.evaluate_context_precision(
            query, retrieved_chunks
        )
        
        # Faithfulness
        faithfulness_score, faithfulness_details = self.evaluate_faithfulness(
            answer, context
        )
        
        # Answer Relevance
        relevance_score, relevance_details = self.evaluate_answer_relevance(
            query, answer
        )
        
        # Overall score (weighted average)
        overall_score = (
            precision_score * 0.3 +
            faithfulness_score * 0.4 +
            relevance_score * 0.3
        )
        
        result = {
            "overall_score": round(overall_score, 3),
            "context_precision": {
                "score": precision_score,
                **precision_details
            },
            "faithfulness": {
                "score": faithfulness_score,
                **faithfulness_details
            },
            "answer_relevance": {
                "score": relevance_score,
                **relevance_details
            },
            "passed_threshold": overall_score >= settings.CONFIDENCE_THRESHOLD
        }
        
        logger.info(
            "RAG evaluation complete",
            overall=overall_score,
            precision=precision_score,
            faithfulness=faithfulness_score,
            relevance=relevance_score
        )
        
        return result


# Singleton instance
rag_evaluator = RAGEvaluator()
