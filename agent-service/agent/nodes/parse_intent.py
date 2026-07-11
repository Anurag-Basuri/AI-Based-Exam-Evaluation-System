"""
Intent Parser Node.
Determines if the teacher's chat request can be handled via simple state manipulation
(zero LLM tokens) or requires an LLM call.
"""

import re
import logging
from agent.state import AgentState

logger = logging.getLogger(__name__)

# Simple regex patterns for zero-LLM operations
SIMPLE_PATTERNS = {
    # e.g., "change marks for question 3 to 10" or "set score for q3 to 5"
    r"(?:change|set|update)\s+(?:marks?|score)\s+(?:for\s+)?(?:q(?:uestion)?\s*)?#?(\d+)\s+(?:to\s+)?(\d+)": "update_marks",
    
    # e.g., "remove question 2" or "delete q4"
    r"(?:remove|delete|drop)\s+(?:q(?:uestion)?\s*)?#?(\d+)": "remove_question",
    
    # e.g., "swap question 1 and 3"
    r"(?:swap|reorder|switch)\s+(?:q(?:uestion)?\s*)?#?(\d+)\s+(?:and|with|&)\s+(?:q(?:uestion)?\s*)?#?(\d+)": "swap_questions",
    
    # e.g., "change difficulty of question 2 to hard"
    r"(?:change|set|update)\s+(?:difficulty|level)\s+(?:of\s+)?(?:q(?:uestion)?\s*)?#?(\d+)\s+(?:to\s+)?(easy|medium|hard)": "update_difficulty",
}

def parse_intent_node(state: AgentState) -> AgentState:
    """
    Parses the last message from the teacher to determine the intent.
    """
    if not state.get("messages"):
        state["current_intent"] = {"type": "unknown", "raw": ""}
        return state
        
    last_message = state["messages"][-1].get("content", "")
    
    # 1. Try zero-LLM regex matching first
    for pattern, intent_type in SIMPLE_PATTERNS.items():
        match = re.search(pattern, last_message, re.IGNORECASE)
        if match:
            state["current_intent"] = {
                "type": intent_type,
                "params": match.groups()
            }
            state["steps_log"].append({
                "type": "info",
                "message": f"Understood command: {intent_type} (No AI generation required)"
            })
            logger.info(f"[Agent] Parsed simple intent: {intent_type} with params {match.groups()}")
            return state
            
    # 2. If it's a complex request, flag it for LLM processing
    state["current_intent"] = {
        "type": "llm_required",
        "raw": last_message
    }
    state["steps_log"].append({
        "type": "info",
        "message": "Analyzing complex request..."
    })
    logger.info("[Agent] Falling back to LLM for intent refinement.")
    
    return state
