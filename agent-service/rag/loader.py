"""
Document loaders for RAG pipeline.
Downloads files from Cloudinary URLs and extracts text.
"""

import os
import tempfile
import logging
import httpx
from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader, TextLoader

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

async def extract_text_from_url(url: str, filename: str) -> str:
    """
    Download a file and extract its text content.
    Supported extensions: .pdf, .docx, .txt, .csv
    """
    ext = os.path.splitext(filename)[1].lower()
    
    if ext not in [".pdf", ".docx", ".txt", ".csv"]:
        logger.warning(f"Unsupported file extension: {ext} for file {filename}")
        return ""
        
    temp_path = await download_file(url, ext)
    
    try:
        if ext == ".pdf":
            loader = PyPDFLoader(temp_path)
        elif ext == ".docx":
            loader = Docx2txtLoader(temp_path)
        else: # .txt, .csv
            loader = TextLoader(temp_path, encoding="utf-8")
            
        docs = loader.load()
        full_text = "\n\n".join(doc.page_content for doc in docs)
        return full_text
        
    except Exception as e:
        logger.error(f"Error extracting text from {filename}: {e}")
        return ""
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
