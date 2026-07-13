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
    
    try:
        text = await extract_text_from_url(file_url, original_name)
        
        if not text.strip():
            logger.warning(f"[Embedder] No text extracted from {original_name}")
            return {"status": "failed", "reason": "No text extracted"}
            
        chunks = split_text(text)
        
        if not chunks:
            logger.warning(f"[Embedder] No chunks created from {original_name}")
            return {"status": "failed", "reason": "No chunks created"}
            
        metadatas = [{
            "doc_id": doc_id,
            "classroom_id": classroom_id,
            "source": original_name,
            "chunk_index": i
        } for i in range(len(chunks))]
        
        store.delete_document(classroom_id, doc_id)
        store.add_document(classroom_id, doc_id, chunks, metadatas)
        
        logger.info(f"[Embedder] Successfully embedded {len(chunks)} chunks for {original_name}")
        
        return {
            "status": "success",
            "chunk_count": len(chunks)
        }
    except Exception as e:
        logger.error(f"[Embedder] Unexpected error processing doc {doc_id}: {e}")
        return {"status": "failed", "reason": str(e)}
