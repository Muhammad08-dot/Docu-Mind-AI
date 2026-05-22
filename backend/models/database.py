"""
DocuMind AI - SQLAlchemy Database Models
"""
from sqlalchemy import Column, String, Integer, Float, Text, DateTime, ForeignKey, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import uuid
import enum


Base = declarative_base()


def generate_uuid():
    return str(uuid.uuid4())


class UploadStatusEnum(str, enum.Enum):
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class LanguageEnum(str, enum.Enum):
    EN = "en"
    UR = "ur"
    MIXED = "mixed"


class RoleEnum(str, enum.Enum):
    USER = "user"
    ASSISTANT = "assistant"


# ============== User Model ==============

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=func.now())

    # Relationships
    documents = relationship("Document", back_populates="uploader")
    chat_sessions = relationship("ChatSession", back_populates="user")
    feedbacks = relationship("Feedback", back_populates="user")


# ============== Document Model ==============

class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=generate_uuid)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(10), nullable=False)  # pdf, docx, txt
    file_path = Column(String(500), nullable=False)
    upload_status = Column(Enum(UploadStatusEnum), default=UploadStatusEnum.PROCESSING)
    uploaded_by = Column(String, ForeignKey("users.id"), nullable=False)
    upload_date = Column(DateTime, default=func.now())
    pages = Column(Integer, default=0)
    chunks = Column(Integer, default=0)
    file_size = Column(String(50))
    language = Column(Enum(LanguageEnum), default=LanguageEnum.EN)
    error_message = Column(Text, nullable=True)

    # Relationships
    uploader = relationship("User", back_populates="documents")
    document_chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")


# ============== Document Chunk Model ==============

class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(String, primary_key=True, default=generate_uuid)
    document_id = Column(String, ForeignKey("documents.id"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    page_number = Column(Integer)
    paragraph_ref = Column(String(255))
    vector_id = Column(String(100))  # Reference to vector DB
    created_at = Column(DateTime, default=func.now())

    # Relationships
    document = relationship("Document", back_populates="document_chunks")


# ============== Chat Session Model ==============

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), default="New Conversation")
    language = Column(Enum(LanguageEnum), default=LanguageEnum.EN)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")


# ============== Chat Message Model ==============

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, ForeignKey("chat_sessions.id"), nullable=False)
    role = Column(Enum(RoleEnum), nullable=False)
    content = Column(Text, nullable=False)
    citations = Column(Text)  # JSON serialized citations
    confidence = Column(Float, nullable=True)
    language = Column(Enum(LanguageEnum))
    latency_ms = Column(Integer, nullable=True)
    tokens_used = Column(Integer, nullable=True)
    timestamp = Column(DateTime, default=func.now())

    # Relationships
    session = relationship("ChatSession", back_populates="messages")
    feedback = relationship("Feedback", back_populates="message", uselist=False)


# ============== Feedback Model ==============

class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(String, primary_key=True, default=generate_uuid)
    message_id = Column(String, ForeignKey("chat_messages.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1 or -1
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now())

    # Relationships
    message = relationship("ChatMessage", back_populates="feedback")
    user = relationship("User", back_populates="feedbacks")


# ============== RAG Evaluation Log Model ==============

class RAGEvaluation(Base):
    __tablename__ = "rag_evaluations"

    id = Column(String, primary_key=True, default=generate_uuid)
    message_id = Column(String, ForeignKey("chat_messages.id"), nullable=False)
    query = Column(Text, nullable=False)
    context_precision = Column(Float)
    faithfulness = Column(Float)
    answer_relevance = Column(Float)
    latency_ms = Column(Integer)
    tokens_used = Column(Integer)
    evaluated_at = Column(DateTime, default=func.now())
