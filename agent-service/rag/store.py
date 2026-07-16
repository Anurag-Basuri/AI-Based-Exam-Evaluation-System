"""
ChromaDB Vector Store Manager.
Maintains one collection per classroom.
Uses HuggingFace Inference API for embeddings (no local PyTorch needed).
"""

import os
import logging
import chromadb
from chromadb.config import Settings
import chromadb.utils.embedding_functions as embedding_functions

from config import CHROMA_PERSIST_DIR, EMBEDDING_MODEL, HF_API_KEY

logger = logging.getLogger(__name__)


class VectorStoreManager:
    def __init__(self):
        os.makedirs(CHROMA_PERSIST_DIR, exist_ok=True)
        
        self.client = chromadb.PersistentClient(
            path=CHROMA_PERSIST_DIR,
            settings=Settings(anonymized_telemetry=False)
        )
        
        # Use HF Inference API instead of local SentenceTransformers
        # This runs the embedding model on HuggingFace's servers (free),
        # keeping our server's RAM usage minimal.
        self.embedding_fn = embedding_functions.HuggingFaceEmbeddingFunction(
            api_key=HF_API_KEY,
            model_name=f"sentence-transformers/{EMBEDDING_MODEL}"
        )

    def get_or_create_collection(self, classroom_id: str):
        """Each classroom gets its own isolated collection."""
        collection_name = f"classroom_{classroom_id}"
        return self.client.get_or_create_collection(
            name=collection_name,
            embedding_function=self.embedding_fn,
            metadata={"hnsw:space": "cosine"}
        )

    def add_document(self, classroom_id: str, doc_id: str, chunks: list[str], metadatas: list[dict]):
        """Adds embedded chunks to the classroom's collection."""
        if not chunks:
            return
            
        collection = self.get_or_create_collection(classroom_id)
        
        ids = [f"{doc_id}_chunk_{i}" for i in range(len(chunks))]
        
        collection.add(
            documents=chunks,
            ids=ids,
            metadatas=metadatas
        )
        logger.info(f"[Chroma] Added {len(chunks)} chunks to collection 'classroom_{classroom_id}' for doc {doc_id}")

    def delete_document(self, classroom_id: str, doc_id: str):
        """Removes a specific document's chunks from a collection."""
        collection = self.get_or_create_collection(classroom_id)
        
        results = collection.get(where={"doc_id": doc_id})
        if results and results["ids"]:
            collection.delete(ids=results["ids"])
            logger.info(f"[Chroma] Deleted {len(results['ids'])} chunks for doc {doc_id}")

    def delete_collection(self, classroom_id: str):
        """Deletes an entire classroom's collection."""
        collection_name = f"classroom_{classroom_id}"
        try:
            self.client.delete_collection(name=collection_name)
            logger.info(f"[Chroma] Deleted collection {collection_name}")
        except ValueError:
            pass

    def search(self, classroom_id: str, query: str, n_results: int = 5, doc_ids: list[str] = None) -> list[dict]:
        """
        Search for relevant chunks. Optionally filter by specific document IDs.
        """
        collection = self.get_or_create_collection(classroom_id)
        
        if collection.count() == 0:
            return []

        where_clause = None
        if doc_ids and len(doc_ids) > 0:
            if len(doc_ids) == 1:
                where_clause = {"doc_id": doc_ids[0]}
            else:
                where_clause = {"doc_id": {"$in": doc_ids}}

        actual_n = min(n_results, collection.count())

        results = collection.query(
            query_texts=[query],
            n_results=actual_n,
            where=where_clause
        )

        formatted_results = []
        if results["documents"] and len(results["documents"]) > 0:
            docs = results["documents"][0]
            metas = results["metadatas"][0] if results.get("metadatas") else [{}] * len(docs)
            dists = results["distances"][0] if results.get("distances") else [0] * len(docs)
            
            for doc, meta, dist in zip(docs, metas, dists):
                formatted_results.append({
                    "text": doc,
                    "metadata": meta,
                    "distance": dist
                })
                
        return formatted_results


store = VectorStoreManager()
