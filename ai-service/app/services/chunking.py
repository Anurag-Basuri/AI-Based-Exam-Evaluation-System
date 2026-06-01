import os
from langchain_community.document_loaders import PyMuPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

def load_and_chunk_document(file_path: str, metadata: dict) -> list[Document]:
    ext = os.path.splitext(file_path)[1].lower()
    
    if ext == ".pdf":
        loader = PyMuPDFLoader(file_path)
    else:
        loader = TextLoader(file_path, encoding="utf-8")
        
    docs = loader.load()
    
    # Add our custom metadata
    for doc in docs:
        doc.metadata.update(metadata)
        
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len,
        is_separator_regex=False,
    )
    
    chunks = text_splitter.split_documents(docs)
    return chunks
