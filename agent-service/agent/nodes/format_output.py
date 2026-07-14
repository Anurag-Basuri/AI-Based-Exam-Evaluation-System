"""
Output Formatting and Validation Node.
"""

import logging
from agent.state import AgentState

logger = logging.getLogger(__name__)


def _normalize_question(q: dict) -> dict:
    """Normalize common LLM field-name mismatches to the expected schema."""
    # text: LLMs sometimes use 'question' instead of 'text'
    if "text" not in q and "question" in q:
        q["text"] = q.pop("question")

    # max_marks: LLMs sometimes use 'marks' instead of 'max_marks'
    if "max_marks" not in q and "marks" in q:
        q["max_marks"] = q.pop("marks")

    # difficulty: default if missing
    if "difficulty" not in q:
        q["difficulty"] = "medium"

    # options normalization for MCQs
    if q.get("type") == "multiple-choice" and "options" in q:
        for opt in q["options"]:
            # isCorrect: LLMs sometimes use 'correct' instead of 'isCorrect'
            if "isCorrect" not in opt and "correct" in opt:
                opt["isCorrect"] = opt.pop("correct")
            # Also handle 'is_correct'
            if "isCorrect" not in opt and "is_correct" in opt:
                opt["isCorrect"] = opt.pop("is_correct")
            # Default to False if still missing
            if "isCorrect" not in opt:
                opt["isCorrect"] = False

    # tags: default if missing
    if "tags" not in q:
        q["tags"] = []

    return q


def format_node(state: AgentState) -> AgentState:
    """
    Normalizes and validates the generated questions against the required schema.
    If valid, clears validation_errors. If invalid, sets them.
    """
    questions = state.get("questions", [])
    errors = []
    
    if not questions:
        errors.append("No questions were generated.")

    # Normalize all questions first
    questions = [_normalize_question(q) for q in questions]
    state["questions"] = questions
        
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
        state["retry_count"] = state.get("retry_count", 0) + 1
        state["steps_log"].append({
            "type": "error",
            "message": "Validation failed:\n" + "\n".join(errors)
        })
        logger.warning(f"[Agent] Validation failed with {len(errors)} errors. (retry {state['retry_count']})")
    else:
        state["validation_errors"] = []
        if state.get("retry_count", 0) > 0:
            state["steps_log"].append({
                "type": "info",
                "message": "Validation passed after retry."
            })
            
    return state

