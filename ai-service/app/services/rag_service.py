import os
from langchain_chroma import Chroma
from app.config import settings
from app.services.llm_service import get_embeddings, get_llm
from app.services.chunking import load_and_chunk_document

def get_vectorstore():
    return Chroma(
        persist_directory=settings.CHROMA_DB_DIR,
        embedding_function=get_embeddings()
    )

def ingest_document(file_path: str, exam_id: str = None, teacher_id: str = None):
    metadata = {}
    if exam_id: metadata["exam_id"] = exam_id
    if teacher_id: metadata["teacher_id"] = teacher_id
    
    chunks = load_and_chunk_document(file_path, metadata)
    if not chunks:
        return 0
        
    vectorstore = get_vectorstore()
    vectorstore.add_documents(documents=chunks)
    return len(chunks)

def retrieve_context(exam_id: str = None, teacher_id: str = None, query: str = "", top_k: int = 5):
    vectorstore = get_vectorstore()
    
    filter_dict = {}
    if exam_id:
        filter_dict["exam_id"] = exam_id
    elif teacher_id:
        filter_dict["teacher_id"] = teacher_id
        
    search_kwargs = {"k": top_k}
    if filter_dict:
        search_kwargs["filter"] = filter_dict
        
    retriever = vectorstore.as_retriever(search_kwargs=search_kwargs)
    docs = retriever.invoke(query)
    return docs
