"""
DocuMind AI - Document Processing Service
Handles: Parsing, OCR, Chunking, Embedding
"""
import os
import re
from typing import List, Tuple, Optional
from pathlib import Path
import structlog

from langchain.text_splitter import RecursiveCharacterTextSplitter
from config import settings

logger = structlog.get_logger()


class DocumentProcessor:
    """Processes documents through the ingestion pipeline"""
    
    def __init__(self):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP,
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""]
        )
        logger.info(
            "Initialized DocumentProcessor",
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP
        )
    
    def detect_language(self, text: str) -> str:
        """Detect if text is primarily Urdu or English"""
        # Simple heuristic: check for Urdu Unicode range
        urdu_pattern = re.compile(r'[\u0600-\u06FF]')
        urdu_chars = len(urdu_pattern.findall(text))
        total_chars = len(text.replace(" ", ""))
        
        if total_chars == 0:
            return "en"
        
        urdu_ratio = urdu_chars / total_chars
        if urdu_ratio > 0.3:
            return "ur" if urdu_ratio > 0.7 else "mixed"
        return "en"
    
    def extract_text_from_pdf(self, file_path: str) -> Tuple[str, int, bool]:
        """
        Extract text from PDF file
        Returns: (text, page_count, used_ocr)
        """
        import pdfplumber
        from PIL import Image
        import pytesseract
        import io
        
        text_parts = []
        page_count = 0
        used_ocr = False
        
        try:
            with pdfplumber.open(file_path) as pdf:
                page_count = len(pdf.pages)
                
                for page_num, page in enumerate(pdf.pages, 1):
                    # Try extracting text directly
                    page_text = page.extract_text() or ""
                    
                    # If text is too short, might be scanned - try OCR
                    if len(page_text.strip()) < 50:
                        # Convert page to image and OCR
                        try:
                            img = page.to_image(resolution=300)
                            pil_image = img.original
                            ocr_text = pytesseract.image_to_string(
                                pil_image,
                                lang='eng+urd'  # English and Urdu
                            )
                            if len(ocr_text.strip()) > len(page_text.strip()):
                                page_text = ocr_text
                                used_ocr = True
                        except Exception as e:
                            logger.warning(f"OCR failed for page {page_num}", error=str(e))
                    
                    text_parts.append(f"[Page {page_num}]\n{page_text}")
        
        except Exception as e:
            logger.error("Failed to extract PDF", path=file_path, error=str(e))
            raise
        
        return "\n\n".join(text_parts), page_count, used_ocr
    
    def extract_text_from_docx(self, file_path: str) -> Tuple[str, int]:
        """
        Extract text from DOCX file
        Returns: (text, page_count_estimate)
        """
        from docx import Document
        
        doc = Document(file_path)
        text_parts = []
        
        for para in doc.paragraphs:
            if para.text.strip():
                text_parts.append(para.text)
        
        # Also extract from tables
        for table in doc.tables:
            for row in table.rows:
                row_text = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
                if row_text:
                    text_parts.append(row_text)
        
        full_text = "\n\n".join(text_parts)
        
        # Estimate page count (rough: ~3000 chars per page)
        page_estimate = max(1, len(full_text) // 3000)
        
        return full_text, page_estimate
    
    def extract_text_from_txt(self, file_path: str) -> Tuple[str, int]:
        """
        Extract text from TXT file
        Returns: (text, page_count_estimate)
        """
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            text = f.read()
        
        page_estimate = max(1, len(text) // 3000)
        return text, page_estimate
    
    def extract_text(self, file_path: str, file_type: str) -> Tuple[str, int, bool]:
        """
        Extract text from any supported file type
        Returns: (text, page_count, used_ocr)
        """
        file_type = file_type.lower()
        
        if file_type == "pdf":
            return self.extract_text_from_pdf(file_path)
        elif file_type == "docx":
            text, pages = self.extract_text_from_docx(file_path)
            return text, pages, False
        elif file_type == "txt":
            text, pages = self.extract_text_from_txt(file_path)
            return text, pages, False
        else:
            raise ValueError(f"Unsupported file type: {file_type}")
    
    def chunk_text(self, text: str, doc_id: str, filename: str) -> List[dict]:
        """
        Split text into chunks with metadata
        Returns list of chunk dictionaries
        """
        chunks = self.text_splitter.split_text(text)
        
        chunk_data = []
        current_page = 1
        
        for idx, chunk in enumerate(chunks):
            # Try to detect page number from chunk content
            page_match = re.search(r'\[Page (\d+)\]', chunk)
            if page_match:
                current_page = int(page_match.group(1))
            
            # Generate paragraph reference
            para_preview = chunk[:50].replace('\n', ' ').strip()
            para_ref = f"Chunk {idx + 1}: {para_preview}..."
            
            chunk_data.append({
                "chunk_id": f"{doc_id}_chunk_{idx}",
                "doc_id": doc_id,
                "filename": filename,
                "chunk_index": idx,
                "content": chunk,
                "page_number": current_page,
                "paragraph_ref": para_ref,
            })
        
        logger.info(
            "Chunked document",
            doc_id=doc_id,
            chunks=len(chunk_data),
            avg_chunk_size=sum(len(c["content"]) for c in chunk_data) // max(1, len(chunk_data))
        )
        
        return chunk_data
    
    def process_document(
        self,
        file_path: str,
        doc_id: str,
        filename: str,
        file_type: str
    ) -> Tuple[List[dict], int, str, bool]:
        """
        Full document processing pipeline
        Returns: (chunks, page_count, language, used_ocr)
        """
        logger.info("Processing document", doc_id=doc_id, filename=filename)
        
        # Extract text
        text, page_count, used_ocr = self.extract_text(file_path, file_type)
        
        if not text.strip():
            raise ValueError("No text could be extracted from document")
        
        # Detect language
        language = self.detect_language(text)
        
        # Chunk text
        chunks = self.chunk_text(text, doc_id, filename)
        
        logger.info(
            "Document processed",
            doc_id=doc_id,
            pages=page_count,
            chunks=len(chunks),
            language=language,
            used_ocr=used_ocr
        )
        
        return chunks, page_count, language, used_ocr


# Singleton instance
document_processor = DocumentProcessor()
