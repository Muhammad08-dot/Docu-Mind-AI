"""
DocuMind AI - Chat/Query API Routes
"""
import uuid
import re
import json
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from config import settings
from database.connection import get_db
from models.database import ChatSession, ChatMessage as DBChatMessage, LanguageEnum, RoleEnum
from models.schemas import (
    QueryRequest, QueryResponse, Citation,
    ChatSessionResponse, ChatMessage, FeedbackRequest, FeedbackResponse
)
from services.retriever import retriever
from services.llm_service import llm_service

router = APIRouter(prefix="/api/v1", tags=["Chat"])


def detect_language(text: str) -> str:
    """Detect if text is Urdu or English"""
    urdu_pattern = re.compile(r'[\u0600-\u06FF]')
    urdu_chars = len(urdu_pattern.findall(text))
    total_chars = len(text.replace(" ", ""))
    
    if total_chars == 0:
        return "en"
    
    urdu_ratio = urdu_chars / total_chars
    return "ur" if urdu_ratio > 0.3 else "en"


def extract_citations(sources: list) -> list[Citation]:
    """Convert retrieved sources to citation format"""
    citations = []
    for source in sources:
        citations.append(Citation(
            doc_id=source.get("doc_id", ""),
            filename=source.get("filename", "Unknown"),
            page=source.get("page_number", 1),
            paragraph=source.get("paragraph_ref", ""),
            chunk_text=source.get("content", source.get("text", ""))[:200],
            relevance_score=source.get("relevance_score", 0),
        ))
    return citations


@router.post("/query", response_model=QueryResponse)
async def query_documents(
    request: QueryRequest,
    db: Session = Depends(get_db),
):
    """
    Query documents using RAG pipeline
    
    Pipeline:
    1. Hybrid search (BM25 + Semantic)
    2. Cross-encoder reranking
    3. LLM generation with citations
    4. Confidence scoring
    """
    query = request.query.strip()
    
    if not query:
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    # Detect language
    language = request.language.value if request.language else detect_language(query)
    
    # Get or create session
    session_id = request.session_id
    if not session_id:
        session = ChatSession(
            id=str(uuid.uuid4()),
            user_id="demo-user",  # Replace with current user
            title=query[:50] + ("..." if len(query) > 50 else ""),
            language=LanguageEnum(language),
        )
        db.add(session)
        db.commit()
        session_id = session.id
    
    # Store user message
    user_msg = DBChatMessage(
        id=str(uuid.uuid4()),
        session_id=session_id,
        role=RoleEnum.USER,
        content=query,
        language=LanguageEnum(language),
    )
    db.add(user_msg)
    
    # Retrieve relevant documents
    sources, context = retriever.retrieve_with_context(query, top_k=request.top_k)
    
    if not sources:
        # No relevant documents found
        answer = (
            "I don't know based on the provided documents. "
            "No relevant information was found for your query."
            if language == "en" else
            "مجھے فراہم کردہ دستاویزات کی بنیاد پر معلوم نہیں۔ "
            "آپ کے سوال کے لیے کوئی متعلقہ معلومات نہیں ملی۔"
        )
        confidence = 0.0
        tokens_used = 0
        latency_ms = 0
    else:
        # Generate answer using LLM
        answer, tokens_used, latency_ms = llm_service.generate(
            query=query,
            context=context,
            language=language
        )
        
        # Calculate confidence
        confidence = llm_service.calculate_confidence(answer, context, sources)
    
    # Check confidence threshold
    if confidence < settings.CONFIDENCE_THRESHOLD and sources:
        # Add uncertainty notice
        uncertainty_notice = (
            "\n\n*Note: This answer has lower confidence. Please verify with the source documents.*"
            if language == "en" else
            "\n\n*نوٹ: اس جواب میں کم اعتماد ہے۔ براہ کرم ماخذ دستاویزات سے تصدیق کریں۔*"
        )
        answer += uncertainty_notice
    
    # Extract citations
    citations = extract_citations(sources)
    
    # Store assistant message
    assistant_msg = DBChatMessage(
        id=str(uuid.uuid4()),
        session_id=session_id,
        role=RoleEnum.ASSISTANT,
        content=answer,
        citations=json.dumps([c.model_dump() for c in citations]),
        confidence=confidence,
        language=LanguageEnum(language),
        latency_ms=latency_ms,
        tokens_used=tokens_used,
    )
    db.add(assistant_msg)
    db.commit()
    
    return QueryResponse(
        id=assistant_msg.id,
        query=query,
        answer=answer,
        citations=citations,
        confidence=confidence,
        language=LanguageEnum(language),
        latency_ms=latency_ms,
        tokens_used=tokens_used,
        session_id=session_id,
        timestamp=datetime.utcnow(),
    )


@router.get("/sessions")
async def list_sessions(
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    """List chat sessions"""
    sessions = (
        db.query(ChatSession)
        .order_by(ChatSession.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    
    return [
        ChatSessionResponse(
            id=s.id,
            title=s.title,
            created_at=s.created_at,
            message_count=len(s.messages),
            language=s.language,
        )
        for s in sessions
    ]


@router.get("/sessions/{session_id}/messages")
async def get_session_messages(
    session_id: str,
    db: Session = Depends(get_db),
):
    """Get all messages in a chat session"""
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    messages = []
    for msg in session.messages:
        citations = None
        if msg.citations:
            try:
                citations = [Citation(**c) for c in json.loads(msg.citations)]
            except:
                pass
        
        messages.append(ChatMessage(
            id=msg.id,
            role=msg.role,
            message=msg.content,
            citations=citations,
            timestamp=msg.timestamp,
            feedback=msg.feedback.rating if msg.feedback else None,
            confidence=msg.confidence,
            language=msg.language,
        ))
    
    return messages


@router.post("/feedback", response_model=FeedbackResponse)
async def submit_feedback(
    request: FeedbackRequest,
    db: Session = Depends(get_db),
):
    """
    Submit feedback for a message (thumbs up/down)
    
    Used for future fine-tuning and quality tracking
    """
    from models.database import Feedback
    
    # Check message exists
    msg = db.query(DBChatMessage).filter(DBChatMessage.id == request.message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Check for existing feedback
    existing = db.query(Feedback).filter(Feedback.message_id == request.message_id).first()
    
    if existing:
        # Update existing feedback
        existing.rating = request.rating
        existing.comment = request.comment
        db.commit()
        feedback = existing
    else:
        # Create new feedback
        feedback = Feedback(
            id=str(uuid.uuid4()),
            message_id=request.message_id,
            user_id="demo-user",  # Replace with current user
            rating=request.rating,
            comment=request.comment,
        )
        db.add(feedback)
        db.commit()
    
    return FeedbackResponse(
        id=feedback.id,
        message_id=feedback.message_id,
        rating=feedback.rating,
        comment=feedback.comment,
        created_at=feedback.created_at,
    )
