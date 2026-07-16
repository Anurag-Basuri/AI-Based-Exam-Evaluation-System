"""
Text splitting utility for RAG.
Pure Python implementation — no langchain-text-splitters dependency needed.
"""


def split_text(text: str, chunk_size: int = 800, chunk_overlap: int = 150) -> list[str]:
    """
    Split text into chunks suitable for embedding.
    Uses a recursive strategy: tries splitting by paragraphs first,
    then sentences, then words — mimicking RecursiveCharacterTextSplitter.
    """
    if not text or not text.strip():
        return []

    separators = ["\n\n", "\n", ". ", "? ", "! ", " "]
    return _recursive_split(text.strip(), chunk_size, chunk_overlap, separators)


def _recursive_split(
    text: str,
    chunk_size: int,
    chunk_overlap: int,
    separators: list[str],
) -> list[str]:
    """Recursively split text using the first separator that produces segments."""
    if len(text) <= chunk_size:
        return [text]

    # Find the best separator that actually appears in the text
    sep = ""
    for s in separators:
        if s in text:
            sep = s
            break

    # If no separator works, hard-split by character
    if not sep:
        chunks = []
        start = 0
        while start < len(text):
            end = min(start + chunk_size, len(text))
            chunks.append(text[start:end])
            start = end - chunk_overlap
        return chunks

    # Split by the chosen separator
    parts = text.split(sep)
    chunks = []
    current = ""

    for part in parts:
        candidate = (current + sep + part).strip() if current else part.strip()

        if len(candidate) <= chunk_size:
            current = candidate
        else:
            # Flush current chunk
            if current:
                chunks.append(current)
            # If this single part is still too large, recurse with next separator
            remaining_seps = separators[separators.index(sep) + 1:]
            if len(part.strip()) > chunk_size and remaining_seps:
                chunks.extend(
                    _recursive_split(part.strip(), chunk_size, chunk_overlap, remaining_seps)
                )
                current = ""
            else:
                current = part.strip()

    if current:
        chunks.append(current)

    # Apply overlap by merging trailing/leading text between adjacent chunks
    if chunk_overlap > 0 and len(chunks) > 1:
        overlapped = [chunks[0]]
        for i in range(1, len(chunks)):
            prev = chunks[i - 1]
            overlap_text = prev[-chunk_overlap:] if len(prev) > chunk_overlap else prev
            merged = (overlap_text + sep + chunks[i]).strip()
            # Only add overlap if it doesn't blow past chunk_size too much
            if len(merged) <= chunk_size * 1.2:
                overlapped.append(merged)
            else:
                overlapped.append(chunks[i])
        chunks = overlapped

    return chunks
