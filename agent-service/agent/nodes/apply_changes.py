"""
Apply Changes Node for Refinement.
Executes zero-LLM operations directly or calls the LLM if needed.
"""

import logging
import json
from agent.state import AgentState, QuestionDraft
from agent.nodes.generate import ExamOutputSchema
from llm_factory import get_llm
from prompts.refinement import get_exam_refinement_prompt

logger = logging.getLogger(__name__)

def apply_changes_node(state: AgentState) -> AgentState:
    """
    Applies the requested changes to the current exam draft.
    """
    intent = state.get("current_intent", {})
    intent_type = intent.get("type")
    questions = state.get("questions", [])
    
    if not questions:
        state["steps_log"].append({"type": "error", "message": "No draft to modify."})
        return state
        
    if intent_type == "update_marks":
        try:
            q_idx = int(intent["params"][0]) - 1
            new_marks = int(intent["params"][1])
            if 0 <= q_idx < len(questions):
                questions[q_idx]["max_marks"] = new_marks
                state["steps_log"].append({"type": "info", "message": f"Updated Question {q_idx+1} marks to {new_marks}."})
            else:
                state["steps_log"].append({"type": "error", "message": f"Question {q_idx+1} not found."})
        except Exception:
            pass
            
    elif intent_type == "remove_question":
        try:
            q_idx = int(intent["params"][0]) - 1
            if 0 <= q_idx < len(questions):
                questions.pop(q_idx)
                state["steps_log"].append({"type": "info", "message": f"Removed Question {q_idx+1}."})
            else:
                state["steps_log"].append({"type": "error", "message": f"Question {q_idx+1} not found."})
        except Exception:
            pass
            
    elif intent_type == "swap_questions":
        try:
            q1_idx = int(intent["params"][0]) - 1
            q2_idx = int(intent["params"][1]) - 1
            if 0 <= q1_idx < len(questions) and 0 <= q2_idx < len(questions):
                questions[q1_idx], questions[q2_idx] = questions[q2_idx], questions[q1_idx]
                state["steps_log"].append({"type": "info", "message": f"Swapped Question {q1_idx+1} and {q2_idx+1}."})
            else:
                state["steps_log"].append({"type": "error", "message": "One or both questions not found."})
        except Exception:
            pass
            
    elif intent_type == "update_difficulty":
        try:
            q_idx = int(intent["params"][0]) - 1
            new_diff = intent["params"][1].lower()
            if 0 <= q_idx < len(questions):
                questions[q_idx]["difficulty"] = new_diff
                state["steps_log"].append({"type": "info", "message": f"Updated Question {q_idx+1} difficulty to {new_diff}."})
            else:
                state["steps_log"].append({"type": "error", "message": f"Question {q_idx+1} not found."})
        except Exception:
            pass
            
    elif intent_type == "llm_required":
        # Complex operation: call LLM
        state["steps_log"].append({"type": "generation", "message": "Using AI to modify the exam..."})
        
        context_text = "\n\n---\n\n".join(state.get("context_chunks", []))
        
        llm, provider = get_llm()
        try:
            structured_llm = llm.with_structured_output(ExamOutputSchema)
        except NotImplementedError:
            structured_llm = llm.with_structured_output(ExamOutputSchema, method="json_mode")
            
        prompt = get_exam_refinement_prompt()
        chain = prompt | structured_llm
        
        try:
            result: ExamOutputSchema = chain.invoke({
                "current_draft": json.dumps(questions, indent=2),
                "context": context_text if context_text else "No specific materials provided.",
                "request": intent.get("raw", "")
            })
            
            # Update state with new draft
            state["questions"] = [q.model_dump() for q in result.questions]
            state["steps_log"].append({"type": "info", "message": "AI modification successful."})
            
        except Exception as e:
            logger.error(f"[Agent] Refinement LLM failed: {e}")
            state["validation_errors"].append(str(e))
            state["steps_log"].append({"type": "error", "message": f"AI modification failed: {e}"})
            
    else:
        state["steps_log"].append({"type": "error", "message": "Could not understand the request."})
        
    return state
