"""
DocuMind AI - Pydantic Schemas for API Request/Response
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime
from enum import Enum


# ============== Enums ==============

class UploadStatus(str, Enum):
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class Language(str, Enum):
    EN = "en"
    UR = "ur"
    MIXED = "mixed"


class Role(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"


# ============== Document Schemas ==============

class DocumentBase(BaseModel):
    filename: str
    file_type: Literal["pdf", "docx", "txt"]


class DocumentCreate(DocumentBase):
    pass


class DocumentResponse(DocumentBase):
    id: str
    upload_status: UploadStatus
    uploaded_by: str
    upload_date: datetime
    pages: int = 0
    chunks: int = 0
    size: str
    language: Language = Language.EN

    class Config:
        from_attributes = True


class DocumentListResponse(BaseModel):
    documents: List[DocumentResponse]
    total: int
    page: int
    limit: int


# ============== Citation Schemas ==============

class Citation(BaseModel):
    doc_id: str
    filename: str
    page: int
    paragraph: str
    chunk_text: str = ""
    relevance_score: float = Field(ge=0, le=1)


# ============== Chat Schemas ==============

class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)
    session_id: Optional[str] = None
    language: Optional[Language] = None  # Auto-detect if not provided
    top_k: int = Field(default=5, ge=1, le=20)


class QueryResponse(BaseModel):
    id: str
    query: str
    answer: str
    citations: List[Citation]
    confidence: float = Field(ge=0, le=1)
    language: Language
    latency_ms: int
    tokens_used: int
    session_id: str
    timestamp: datetime


class ChatMessage(BaseModel):
    id: str
    role: Role
    message: str
    citations: Optional[List[Citation]] = None
    timestamp: datetime
    feedback: Optional[Literal[1, -1]] = None
    confidence: Optional[float] = None
    language: Optional[Language] = None


class ChatSessionResponse(BaseModel):
    id: str
    title: str
    created_at: datetime
    message_count: int
    language: Language


# ============== Feedback Schemas ==============

class FeedbackRequest(BaseModel):
    message_id: str
    rating: Literal[1, -1]
    comment: Optional[str] = None


class FeedbackResponse(BaseModel):
    id: str
    message_id: str
    rating: int
    comment: Optional[str]
    created_at: datetime


# ============== RAG Metrics Schemas ==============

class RAGMetrics(BaseModel):
    context_precision: float = Field(ge=0, le=1)
    faithfulness: float = Field(ge=0, le=1)
    answer_relevance: float = Field(ge=0, le=1)
    latency_ms: int
    tokens_used: int


class EvalEntry(BaseModel):
    id: str
    query: str
    context_precision: float
    faithfulness: float
    answer_relevance: float
    latency: int
    timestamp: datetime


class SystemStats(BaseModel):
    total_documents: int
    total_chunks: int
    total_queries: int
    avg_latency: float
    avg_faithfulness: float
    avg_precision: float
    avg_relevance: float
    uptime_hours: float


# ============== User Schemas ==============

class UserBase(BaseModel):
    username: str
    email: str


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: Optional[str] = None


# ============== Health Check ==============

class HealthResponse(BaseModel):
    status: str = "healthy"
    version: str
    database: str
    vector_db: str
    llm_provider: str
