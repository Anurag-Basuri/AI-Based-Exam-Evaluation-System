"""
Main embedding pipeline.
Connects loader, chunker, and store.
"""

import logging
from rag.loader import extract_text_from_url
from rag.chunker import split_text
from rag.store import store

logger = logging.getLogger(__name__)

async def process_and_store_document(classroom_id: str, doc_id: str, file_url: str, original_name: str) -> dict:
    """
    Full pipeline to process a document and store it in ChromaDB.
    Returns metadata about the embedding process.
    """
    logger.info(f"[Embedder] Processing doc {doc_id} for classroom {classroom_id}")
    
    # 1. Download and extract text
    text = await extract_text_from_url(file_url, original_name)
    
    if not text.strip():
        logger.warning(f"[Embedder] No text extracted from {original_name}")
        return {"status": "failed", "reason": "No text extracted"}
        
    # 2. Chunk text
    chunks = split_text(text)
    
    if not chunks:
        logger.warning(f"[Embedder] No chunks created from {original_name}")
        return {"status": "failed", "reason": "No chunks created"}
        
    # 3. Prepare metadata
    metadatas = [{
        "doc_id": doc_id,
        "classroom_id": classroom_id,
        "source": original_name,
        "chunk_index": i
    } for i in range(len(chunks))]
    
    # 4. Clean up existing chunks for this doc (if any) before storing new ones
    store.delete_document(classroom_id, doc_id)
    
    # 5. Store in ChromaDB
    store.add_document(classroom_id, doc_id, chunks, metadatas)
    
    logger.info(f"[Embedder] Successfully embedded {len(chunks)} chunks for {original_name}")
    
    return {
        "status": "success",
        "chunk_count": len(chunks)
    }
