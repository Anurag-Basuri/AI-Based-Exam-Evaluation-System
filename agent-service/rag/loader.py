"""
Document loaders for RAG pipeline.
Downloads files from URLs and extracts text using pypdf and python-docx directly.
No langchain-community dependency needed.
"""

import os
import tempfile
import logging
import httpx
from pypdf import PdfReader
from docx import Document as DocxDocument

logger = logging.getLogger(__name__)

async def download_file(url: str, suffix: str) -> str:
    """Download a file to a temporary location."""
    fd, temp_path = tempfile.mkstemp(suffix=suffix)
    os.close(fd)
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            with open(temp_path, "wb") as f:
                f.write(response.content)
        return temp_path
    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise e

def _extract_pdf(path: str) -> str:
    """Extract text from a PDF file using pypdf."""
    reader = PdfReader(path)
    pages = [page.extract_text() or "" for page in reader.pages]
    return "\n\n".join(pages)

def _extract_docx(path: str) -> str:
    """Extract text from a DOCX file using python-docx."""
    doc = DocxDocument(path)
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    return "\n\n".join(paragraphs)

def _extract_text(path: str) -> str:
    """Read a plain text file."""
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()

async def extract_text_from_url(url: str, filename: str) -> str:
    """
    Download a file and extract its text content.
    Supported extensions: .pdf, .docx, .txt, .csv
    """
    ext = os.path.splitext(filename)[1].lower()
    
    extractors = {
        ".pdf": _extract_pdf,
        ".docx": _extract_docx,
        ".txt": _extract_text,
        ".csv": _extract_text,
    }
    
    if ext not in extractors:
        logger.warning(f"Unsupported file extension: {ext} for file {filename}")
        return ""
        
    temp_path = await download_file(url, ext)
    
    try:
        return extractors[ext](temp_path)
    except Exception as e:
        logger.error(f"Error extracting text from {filename}: {e}")
        return ""
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
