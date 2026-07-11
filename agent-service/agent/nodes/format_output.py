"""
Output Formatting and Validation Node.
"""

import logging
from agent.state import AgentState

logger = logging.getLogger(__name__)

def format_node(state: AgentState) -> AgentState:
    """
    Validates the generated questions against the required schema.
    If valid, clears validation_errors. If invalid, sets them.
    """
    questions = state.get("questions", [])
    errors = []
    
    if not questions:
        errors.append("No questions were generated.")
        
    for i, q in enumerate(questions):
        q_type = q.get("type")
        if q_type not in ["multiple-choice", "subjective"]:
            errors.append(f"Question {i+1} has invalid type: {q_type}")
            
        if q_type == "multiple-choice":
            options = q.get("options", [])
            if len(options) != 4:
                errors.append(f"Question {i+1} (MCQ) must have exactly 4 options. Found {len(options)}.")
            correct_count = sum(1 for opt in options if opt.get("isCorrect"))
            if correct_count != 1:
                errors.append(f"Question {i+1} (MCQ) must have exactly 1 correct option. Found {correct_count}.")
                
        if q_type == "subjective":
            if not q.get("answer"):
                errors.append(f"Question {i+1} (Subjective) is missing a model answer.")
                
    if errors:
        state["validation_errors"] = errors
        state["steps_log"].append({
            "type": "error",
            "message": "Validation failed:\n" + "\n".join(errors)
        })
        logger.warning(f"[Agent] Validation failed with {len(errors)} errors.")
    else:
        state["validation_errors"] = []
        if state.get("retried"):
            state["steps_log"].append({
                "type": "info",
                "message": "Validation passed after retry."
            })
            
    return state
