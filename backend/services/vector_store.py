"""
DocuMind AI - Vector Store Service (Qdrant / FAISS)
"""
from typing import List, Tuple, Optional
import numpy as np
from sentence_transformers import SentenceTransformer
import structlog

from config import settings

logger = structlog.get_logger()


class VectorStore:
    """Abstract vector store interface"""
    
    def __init__(self):
        self.embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL)
        self.dimension = settings.EMBEDDING_DIMENSION
        logger.info("Loaded embedding model", model=settings.EMBEDDING_MODEL)
    
    def embed_text(self, text: str) -> List[float]:
        """Generate embedding for a single text"""
        embedding = self.embedding_model.encode(text, convert_to_numpy=True)
        return embedding.tolist()
    
    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts"""
        embeddings = self.embedding_model.encode(texts, convert_to_numpy=True)
        return embeddings.tolist()
    
    def add_documents(self, ids: List[str], texts: List[str], metadatas: List[dict]) -> None:
        """Add documents to vector store"""
        raise NotImplementedError
    
    def search(self, query: str, top_k: int = 10) -> List[Tuple[str, float, dict]]:
        """Search for similar documents"""
        raise NotImplementedError
    
    def delete_documents(self, ids: List[str]) -> None:
        """Delete documents from vector store"""
        raise NotImplementedError


class QdrantVectorStore(VectorStore):
    """Qdrant vector store implementation"""
    
    def __init__(self):
        super().__init__()
        from qdrant_client import QdrantClient
        from qdrant_client.models import Distance, VectorParams
        
        self.client = QdrantClient(
            host=settings.QDRANT_HOST,
            port=settings.QDRANT_PORT
        )
        self.collection_name = settings.QDRANT_COLLECTION
        
        # Create collection if not exists
        collections = self.client.get_collections().collections
        if not any(c.name == self.collection_name for c in collections):
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(
                    size=self.dimension,
                    distance=Distance.COSINE
                )
            )
            logger.info("Created Qdrant collection", collection=self.collection_name)
    
    def add_documents(self, ids: List[str], texts: List[str], metadatas: List[dict]) -> None:
        """Add documents to Qdrant"""
        from qdrant_client.models import PointStruct
        
        embeddings = self.embed_texts(texts)
        
        points = [
            PointStruct(
                id=idx,
                vector=embedding,
                payload={**metadata, "text": text}
            )
            for idx, (embedding, text, metadata) in enumerate(zip(embeddings, texts, metadatas))
        ]
        
        # Store ID mapping
        for i, doc_id in enumerate(ids):
            points[i].payload["chunk_id"] = doc_id
        
        self.client.upsert(
            collection_name=self.collection_name,
            points=points
        )
        logger.info("Added documents to Qdrant", count=len(ids))
    
    def search(self, query: str, top_k: int = 10) -> List[Tuple[str, float, dict]]:
        """Search Qdrant for similar documents"""
        query_embedding = self.embed_text(query)
        
        results = self.client.search(
            collection_name=self.collection_name,
            query_vector=query_embedding,
            limit=top_k
        )
        
        return [
            (result.payload.get("chunk_id", str(result.id)), result.score, result.payload)
            for result in results
        ]
    
    def delete_documents(self, ids: List[str]) -> None:
        """Delete documents from Qdrant by chunk_id"""
        from qdrant_client.models import Filter, FieldCondition, MatchAny
        
        self.client.delete(
            collection_name=self.collection_name,
            points_selector=Filter(
                must=[
                    FieldCondition(
                        key="chunk_id",
                        match=MatchAny(any=ids)
                    )
                ]
            )
        )
        logger.info("Deleted documents from Qdrant", count=len(ids))


class FAISSVectorStore(VectorStore):
    """FAISS vector store implementation (local file-based)"""
    
    def __init__(self):
        super().__init__()
        import faiss
        import os
        import json
        
        self.index_path = settings.FAISS_INDEX_PATH
        self.metadata_path = f"{self.index_path}_metadata.json"
        
        # Load or create index
        if os.path.exists(f"{self.index_path}.faiss"):
            self.index = faiss.read_index(f"{self.index_path}.faiss")
            with open(self.metadata_path, "r") as f:
                self.metadata = json.load(f)
            logger.info("Loaded FAISS index", vectors=self.index.ntotal)
        else:
            self.index = faiss.IndexFlatIP(self.dimension)  # Inner product (cosine after normalization)
            self.metadata = {"ids": [], "payloads": []}
            logger.info("Created new FAISS index")
    
    def _save_index(self):
        """Save index to disk"""
        import faiss
        import json
        
        faiss.write_index(self.index, f"{self.index_path}.faiss")
        with open(self.metadata_path, "w") as f:
            json.dump(self.metadata, f)
    
    def add_documents(self, ids: List[str], texts: List[str], metadatas: List[dict]) -> None:
        """Add documents to FAISS"""
        import faiss
        
        embeddings = self.embed_texts(texts)
        embeddings_np = np.array(embeddings, dtype=np.float32)
        
        # Normalize for cosine similarity
        faiss.normalize_L2(embeddings_np)
        
        self.index.add(embeddings_np)
        
        for doc_id, text, metadata in zip(ids, texts, metadatas):
            self.metadata["ids"].append(doc_id)
            self.metadata["payloads"].append({**metadata, "text": text})
        
        self._save_index()
        logger.info("Added documents to FAISS", count=len(ids))
    
    def search(self, query: str, top_k: int = 10) -> List[Tuple[str, float, dict]]:
        """Search FAISS for similar documents"""
        import faiss
        
        query_embedding = np.array([self.embed_text(query)], dtype=np.float32)
        faiss.normalize_L2(query_embedding)
        
        scores, indices = self.index.search(query_embedding, min(top_k, self.index.ntotal))
        
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx >= 0:  # Valid index
                doc_id = self.metadata["ids"][idx]
                payload = self.metadata["payloads"][idx]
                results.append((doc_id, float(score), payload))
        
        return results
    
    def delete_documents(self, ids: List[str]) -> None:
        """Delete documents from FAISS (requires rebuilding)"""
        # FAISS doesn't support deletion, so we rebuild
        indices_to_keep = [
            i for i, doc_id in enumerate(self.metadata["ids"])
            if doc_id not in ids
        ]
        
        if len(indices_to_keep) == len(self.metadata["ids"]):
            return  # Nothing to delete
        
        import faiss
        
        # Extract vectors to keep
        vectors = np.zeros((len(indices_to_keep), self.dimension), dtype=np.float32)
        for new_idx, old_idx in enumerate(indices_to_keep):
            vectors[new_idx] = self.index.reconstruct(old_idx)
        
        # Rebuild index
        self.index = faiss.IndexFlatIP(self.dimension)
        if len(vectors) > 0:
            self.index.add(vectors)
        
        # Update metadata
        self.metadata["ids"] = [self.metadata["ids"][i] for i in indices_to_keep]
        self.metadata["payloads"] = [self.metadata["payloads"][i] for i in indices_to_keep]
        
        self._save_index()
        logger.info("Deleted documents from FAISS", count=len(ids))


def get_vector_store() -> VectorStore:
    """Factory function to get the configured vector store"""
    if settings.VECTOR_DB == "qdrant":
        return QdrantVectorStore()
    else:
        return FAISSVectorStore()
