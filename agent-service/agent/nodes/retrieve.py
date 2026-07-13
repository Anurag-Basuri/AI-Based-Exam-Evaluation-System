"""
Retrieve Node for RAG.
Searches ChromaDB for relevant classroom materials and records which chunks
were used, so the evaluator can later use the exact same references.
"""

import logging
from agent.state import AgentState
from rag.store import store

logger = logging.getLogger(__name__)

def retrieve_node(state: AgentState) -> AgentState:
    """
    Retrieves context from ChromaDB based on the teacher's config.
    Records the chunk IDs used so evaluation can be scoped to the same references.
    """
    classroom_id = state["classroom_id"]
    config = state["config"]
    
    topic = config.get("topicFocus") or config.get("title", "general exam topics")
    doc_ids = config.get("selectedMaterials", [])
    
    logger.info(f"[Agent] Retrieving context for topic: {topic}")
    
    state["steps_log"].append({
        "type": "retrieval",
        "message": f"Searching classroom materials for topic: '{topic}'..."
    })
    
    results = store.search(classroom_id, query=topic, n_results=8, doc_ids=doc_ids)
    
    context_chunks = [res["text"] for res in results]
    
    # Record the chunk IDs that were used — these will be stored on the Exam
    # so the evaluator can search ONLY these chunks when grading student answers
    used_chunk_ids = []
    for res in results:
        meta = res.get("metadata", {})
        doc_id = meta.get("doc_id", "")
        if doc_id and doc_id not in used_chunk_ids:
            used_chunk_ids.append(doc_id)
    
    msg = f"Retrieved {len(context_chunks)} relevant snippets from {len(used_chunk_ids)} document(s)."
    state["steps_log"].append({
        "type": "info",
        "message": msg
    })
    logger.info(f"[Agent] {msg}")
    
    state["context_chunks"] = context_chunks
    state["used_chunk_ids"] = used_chunk_ids
    return state
