"""
DocuMind AI - Enterprise Multilingual RAG Workspace
Main FastAPI Application

Author: Muhammad
Version: 1.0.0
"""
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import structlog

from config import settings
from database.connection import init_db
from models.schemas import HealthResponse

# Configure structured logging
structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer()
    ]
)
logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events"""
    # Startup
    logger.info("Starting DocuMind AI", version=settings.APP_VERSION)
    
    # Initialize database
    init_db()
    logger.info("Database initialized")
    
    # Initialize vector store
    from services.vector_store import get_vector_store
    vector_store = get_vector_store()
    logger.info("Vector store initialized", type=settings.VECTOR_DB)
    
    # Initialize retriever with existing documents
    from services.retriever import retriever
    from database.connection import get_db_context
    from models.database import DocumentChunk
    
    with get_db_context() as db:
        chunks = db.query(DocumentChunk).all()
        if chunks:
            docs = [
                {
                    "chunk_id": c.id,
                    "doc_id": c.document_id,
                    "content": c.content,
                    "page_number": c.page_number,
                    "paragraph_ref": c.paragraph_ref,
                    "filename": c.document.filename if c.document else "Unknown",
                }
                for c in chunks
            ]
            retriever.build_bm25_index(docs)
            logger.info("BM25 index built", documents=len(docs))
    
    yield
    
    # Shutdown
    logger.info("Shutting down DocuMind AI")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="""
    ## DocuMind AI - Enterprise Multilingual RAG Workspace
    
    A production-grade Retrieval-Augmented Generation platform for querying 
    internal documents with verifiable, cited answers.
    
    ### Features:
    - 📄 Multi-format document ingestion (PDF, DOCX, TXT)
    - 🔍 Hybrid search (BM25 + Semantic vectors)
    - 🎯 Cross-encoder reranking
    - 🌍 Bilingual support (English & Urdu)
    - 📎 Source citations with page references
    - 🛡️ Anti-hallucination guardrails
    - 📊 RAG evaluation metrics
    
    ### Tech Stack:
    - FastAPI + LangChain + SentenceTransformers
    - PostgreSQL + Qdrant/FAISS
    - OpenAI GPT-4 / Ollama (Mistral, Llama)
    """,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    response = await call_next(request)
    
    duration_ms = int((time.time() - start_time) * 1000)
    logger.info(
        "Request completed",
        method=request.method,
        path=request.url.path,
        status=response.status_code,
        duration_ms=duration_ms,
    )
    
    return response


# Exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(
        "Unhandled exception",
        error=str(exc),
        path=request.url.path,
        method=request.method,
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc)}
    )


# Health check endpoint
@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """
    Health check endpoint for monitoring
    
    Returns service status and configuration
    """
    return HealthResponse(
        status="healthy",
        version=settings.APP_VERSION,
        database="postgresql",
        vector_db=settings.VECTOR_DB,
        llm_provider=settings.LLM_PROVIDER,
    )


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "description": "Enterprise Multilingual RAG Workspace",
        "docs": "/docs",
        "health": "/health",
    }


# Import and include routers
from routers import documents, chat, evaluation, websocket

app.include_router(documents.router)
app.include_router(chat.router)
app.include_router(evaluation.router)
app.include_router(websocket.router)


# Run with uvicorn
if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info",
    )
