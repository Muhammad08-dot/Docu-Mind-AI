"""
DocuMind AI - Document Management API Routes
"""
import os
import uuid
import aiofiles
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session

from config import settings
from database.connection import get_db
from models.database import Document, DocumentChunk, User, UploadStatusEnum, LanguageEnum
from models.schemas import DocumentResponse, DocumentListResponse
from services.document_processor import document_processor
from services.vector_store import get_vector_store

router = APIRouter(prefix="/api/v1", tags=["Documents"])


async def process_document_task(
    doc_id: str,
    file_path: str,
    filename: str,
    file_type: str,
    db: Session
):
    """Background task to process uploaded document"""
    try:
        # Process document
        chunks, page_count, language, used_ocr = document_processor.process_document(
            file_path=file_path,
            doc_id=doc_id,
            filename=filename,
            file_type=file_type
        )
        
        # Store chunks in database
        for chunk_data in chunks:
            chunk = DocumentChunk(
                id=chunk_data["chunk_id"],
                document_id=doc_id,
                chunk_index=chunk_data["chunk_index"],
                content=chunk_data["content"],
                page_number=chunk_data["page_number"],
                paragraph_ref=chunk_data["paragraph_ref"],
            )
            db.add(chunk)
        
        # Index in vector store
        vector_store = get_vector_store()
        vector_store.add_documents(
            ids=[c["chunk_id"] for c in chunks],
            texts=[c["content"] for c in chunks],
            metadatas=[{
                "doc_id": c["doc_id"],
                "filename": c["filename"],
                "page_number": c["page_number"],
                "paragraph_ref": c["paragraph_ref"],
            } for c in chunks]
        )
        
        # Update document status
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if doc:
            doc.upload_status = UploadStatusEnum.COMPLETED
            doc.pages = page_count
            doc.chunks = len(chunks)
            doc.language = LanguageEnum(language)
        
        db.commit()
        
    except Exception as e:
        # Mark as failed
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if doc:
            doc.upload_status = UploadStatusEnum.FAILED
            doc.error_message = str(e)
        db.commit()
        raise


@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)  # Add auth later
):
    """
    Upload and process a document
    
    Supported formats: PDF, DOCX, TXT
    Max size: 50MB
    """
    # Validate file extension
    filename = file.filename or "unknown"
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{ext}' not supported. Allowed: {settings.ALLOWED_EXTENSIONS}"
        )
    
    # Check file size
    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)
    
    if size > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max size: {settings.MAX_FILE_SIZE_MB}MB"
        )
    
    # Generate ID and save file
    doc_id = str(uuid.uuid4())
    file_path = os.path.join(settings.UPLOAD_DIR, f"{doc_id}_{filename}")
    
    async with aiofiles.open(file_path, "wb") as f:
        content = await file.read()
        await f.write(content)
    
    # Create database record
    size_str = f"{size / (1024 * 1024):.1f} MB" if size > 1024 * 1024 else f"{size / 1024:.1f} KB"
    
    doc = Document(
        id=doc_id,
        filename=filename,
        file_type=ext,
        file_path=file_path,
        upload_status=UploadStatusEnum.PROCESSING,
        uploaded_by="demo-user",  # Replace with current_user.id
        file_size=size_str,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    
    # Start background processing
    background_tasks.add_task(
        process_document_task,
        doc_id=doc_id,
        file_path=file_path,
        filename=filename,
        file_type=ext,
        db=db
    )
    
    return DocumentResponse(
        id=doc.id,
        filename=doc.filename,
        file_type=doc.file_type,
        upload_status=doc.upload_status,
        uploaded_by=doc.uploaded_by,
        upload_date=doc.upload_date,
        pages=doc.pages,
        chunks=doc.chunks,
        size=doc.file_size,
        language=doc.language or LanguageEnum.EN,
    )


@router.get("/docs", response_model=DocumentListResponse)
async def list_documents(
    limit: int = 20,
    offset: int = 0,
    status: str = None,
    db: Session = Depends(get_db),
):
    """
    List all processed documents
    
    Optional filters:
    - status: processing, completed, failed
    """
    query = db.query(Document)
    
    if status:
        query = query.filter(Document.upload_status == UploadStatusEnum(status))
    
    total = query.count()
    documents = query.order_by(Document.upload_date.desc()).offset(offset).limit(limit).all()
    
    return DocumentListResponse(
        documents=[
            DocumentResponse(
                id=doc.id,
                filename=doc.filename,
                file_type=doc.file_type,
                upload_status=doc.upload_status,
                uploaded_by=doc.uploaded_by,
                upload_date=doc.upload_date,
                pages=doc.pages,
                chunks=doc.chunks,
                size=doc.file_size,
                language=doc.language or LanguageEnum.EN,
            )
            for doc in documents
        ],
        total=total,
        page=offset // limit + 1,
        limit=limit,
    )


@router.get("/docs/{doc_id}", response_model=DocumentResponse)
async def get_document(
    doc_id: str,
    db: Session = Depends(get_db),
):
    """Get document details by ID"""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return DocumentResponse(
        id=doc.id,
        filename=doc.filename,
        file_type=doc.file_type,
        upload_status=doc.upload_status,
        uploaded_by=doc.uploaded_by,
        upload_date=doc.upload_date,
        pages=doc.pages,
        chunks=doc.chunks,
        size=doc.file_size,
        language=doc.language or LanguageEnum.EN,
    )


@router.delete("/docs/{doc_id}")
async def delete_document(
    doc_id: str,
    db: Session = Depends(get_db),
):
    """Delete a document and its chunks"""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete from vector store
    chunk_ids = [chunk.id for chunk in doc.document_chunks]
    if chunk_ids:
        vector_store = get_vector_store()
        vector_store.delete_documents(chunk_ids)
    
    # Delete file
    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)
    
    # Delete from database (cascades to chunks)
    db.delete(doc)
    db.commit()
    
    return {"status": "deleted", "doc_id": doc_id}
