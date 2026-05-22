"""
DocuMind AI - Hybrid Retrieval Service
Combines BM25 (keyword) + Semantic (vector) search with reranking
"""
from typing import List, Tuple, Dict, Any
import re
from rank_bm25 import BM25Okapi
from sentence_transformers import CrossEncoder
import structlog

from config import settings
from services.vector_store import get_vector_store

logger = structlog.get_logger()


class HybridRetriever:
    """
    Hybrid retrieval combining:
    1. BM25 for keyword/exact match
    2. Semantic vector search
    3. Cross-encoder reranking
    """
    
    def __init__(self):
        self.vector_store = get_vector_store()
        self.reranker = CrossEncoder(settings.RERANKER_MODEL)
        self.bm25_index = None
        self.bm25_docs = []
        self.bm25_metadata = []
        logger.info("Initialized HybridRetriever", reranker=settings.RERANKER_MODEL)
    
    def _tokenize(self, text: str) -> List[str]:
        """Simple tokenization for BM25"""
        # Handle both English and Urdu
        text = text.lower()
        # Split on whitespace and punctuation, keep Urdu characters
        tokens = re.findall(r'[\w\u0600-\u06FF]+', text)
        return tokens
    
    def build_bm25_index(self, documents: List[Dict[str, Any]]):
        """Build BM25 index from documents"""
        self.bm25_docs = []
        self.bm25_metadata = []
        
        for doc in documents:
            text = doc.get("content", doc.get("text", ""))
            tokens = self._tokenize(text)
            self.bm25_docs.append(tokens)
            self.bm25_metadata.append(doc)
        
        if self.bm25_docs:
            self.bm25_index = BM25Okapi(self.bm25_docs)
            logger.info("Built BM25 index", documents=len(self.bm25_docs))
    
    def bm25_search(self, query: str, top_k: int = 10) -> List[Tuple[float, Dict[str, Any]]]:
        """Search using BM25"""
        if not self.bm25_index or not self.bm25_docs:
            return []
        
        query_tokens = self._tokenize(query)
        scores = self.bm25_index.get_scores(query_tokens)
        
        # Get top-k results
        top_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:top_k]
        
        results = []
        for idx in top_indices:
            if scores[idx] > 0:
                results.append((scores[idx], self.bm25_metadata[idx]))
        
        return results
    
    def semantic_search(self, query: str, top_k: int = 10) -> List[Tuple[float, Dict[str, Any]]]:
        """Search using vector similarity"""
        results = self.vector_store.search(query, top_k)
        
        return [
            (score, {**metadata, "chunk_id": chunk_id})
            for chunk_id, score, metadata in results
        ]
    
    def rerank(
        self,
        query: str,
        candidates: List[Dict[str, Any]],
        top_k: int = 5
    ) -> List[Tuple[float, Dict[str, Any]]]:
        """Rerank candidates using cross-encoder"""
        if not candidates:
            return []
        
        # Prepare pairs for reranking
        pairs = [
            [query, doc.get("content", doc.get("text", ""))]
            for doc in candidates
        ]
        
        # Get reranker scores
        scores = self.reranker.predict(pairs)
        
        # Sort by score
        scored_docs = list(zip(scores, candidates))
        scored_docs.sort(key=lambda x: x[0], reverse=True)
        
        return scored_docs[:top_k]
    
    def hybrid_search(
        self,
        query: str,
        top_k: int = 5,
        retrieval_k: int = None
    ) -> List[Dict[str, Any]]:
        """
        Full hybrid search pipeline:
        1. Get candidates from both BM25 and semantic search
        2. Merge and deduplicate
        3. Rerank top candidates
        4. Return top-k results with scores
        """
        retrieval_k = retrieval_k or settings.RETRIEVAL_TOP_K
        
        logger.info("Starting hybrid search", query=query[:100], top_k=top_k)
        
        # Get candidates from both sources
        bm25_results = self.bm25_search(query, retrieval_k)
        semantic_results = self.semantic_search(query, retrieval_k)
        
        logger.debug(
            "Retrieved candidates",
            bm25_count=len(bm25_results),
            semantic_count=len(semantic_results)
        )
        
        # Merge results (deduplicate by chunk_id)
        seen_ids = set()
        merged_candidates = []
        
        # Interleave results
        all_results = []
        for score, doc in semantic_results:
            all_results.append(("semantic", score, doc))
        for score, doc in bm25_results:
            all_results.append(("bm25", score, doc))
        
        # Sort by score within each type, then interleave
        for source, score, doc in all_results:
            chunk_id = doc.get("chunk_id", doc.get("doc_id", str(hash(doc.get("content", "")[:100]))))
            if chunk_id not in seen_ids:
                seen_ids.add(chunk_id)
                doc["retrieval_source"] = source
                doc["initial_score"] = float(score)
                merged_candidates.append(doc)
        
        if not merged_candidates:
            logger.warning("No candidates found for query")
            return []
        
        # Rerank
        reranked = self.rerank(query, merged_candidates, top_k=top_k)
        
        # Format results
        results = []
        for score, doc in reranked:
            results.append({
                **doc,
                "rerank_score": float(score),
                "relevance_score": float(score),  # Normalized 0-1 would be better
            })
        
        logger.info(
            "Hybrid search complete",
            candidates=len(merged_candidates),
            returned=len(results),
            top_score=results[0]["rerank_score"] if results else 0
        )
        
        return results
    
    def retrieve_with_context(
        self,
        query: str,
        top_k: int = 5
    ) -> Tuple[List[Dict[str, Any]], str]:
        """
        Retrieve documents and format context for LLM
        Returns: (documents, formatted_context)
        """
        documents = self.hybrid_search(query, top_k)
        
        if not documents:
            return [], ""
        
        # Format context
        context_parts = []
        for i, doc in enumerate(documents, 1):
            filename = doc.get("filename", "Unknown")
            page = doc.get("page_number", "?")
            content = doc.get("content", doc.get("text", ""))
            score = doc.get("relevance_score", 0)
            
            context_parts.append(
                f"[Source {i}] {filename} (Page {page}) [Relevance: {score:.2f}]\n{content}"
            )
        
        context = "\n\n---\n\n".join(context_parts)
        
        return documents, context


# Singleton instance
retriever = HybridRetriever()
