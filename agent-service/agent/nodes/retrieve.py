"""
Retrieve Node for RAG
"""

import logging
from agent.state import AgentState
from rag.store import store

logger = logging.getLogger(__name__)

def retrieve_node(state: AgentState) -> AgentState:
    """
    Retrieves context from ChromaDB based on the teacher's config.
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
    
    results = store.search(classroom_id, query=topic, n_results=5, doc_ids=doc_ids)
    
    context_chunks = [res["text"] for res in results]
    
    msg = f"Retrieved {len(context_chunks)} relevant snippets from materials."
    state["steps_log"].append({
        "type": "info",
        "message": msg
    })
    logger.info(f"[Agent] {msg}")
    
    state["context_chunks"] = context_chunks
    return state
