"""
Text splitting utility for RAG.
"""

from langchain_text_splitters import RecursiveCharacterTextSplitter

def split_text(text: str, chunk_size: int = 800, chunk_overlap: int = 150) -> list[str]:
    """
    Split text into chunks suitable for embedding.
    Uses RecursiveCharacterTextSplitter for optimal semantic boundaries.
    """
    if not text or not text.strip():
        return []
        
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ".", "?", "!", " ", ""]
    )
    
    return splitter.split_text(text)
