"""
Generate Node for initial exam creation.
Uses LLM with structured output when available, falls back to JSON parsing.
"""

import json
import logging
from pydantic import BaseModel, Field

from agent.state import AgentState, QuestionDraft
from llm_factory import get_llm
from prompts.exam_generation import get_exam_generation_prompt

logger = logging.getLogger(__name__)

class ExamOutputSchema(BaseModel):
    questions: list[QuestionDraft] = Field(description="The list of generated questions")

def _parse_json_from_text(text: str) -> dict:
    """Extract JSON from LLM text output, handling markdown code blocks."""
    text = text.strip()
    
    if text.startswith("```"):
        lines = text.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        text = "\n".join(lines).strip()
        
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    
    start = text.find("{")
    end = text.rfind("}") + 1
    if start >= 0 and end > start:
        try:
            return json.loads(text[start:end])
        except json.JSONDecodeError:
            pass
    
    start = text.find("[")
    end = text.rfind("]") + 1
    if start >= 0 and end > start:
        try:
            arr = json.loads(text[start:end])
            return {"questions": arr}
        except json.JSONDecodeError:
            pass
    
    raise ValueError(f"Could not extract valid JSON from LLM output: {text[:300]}")

def generate_node(state: AgentState) -> AgentState:
    """
    Calls the LLM to generate the exam based on config and context.
    Tries structured output first, falls back to raw JSON parsing.
    """
    config = state["config"]
    context_text = "\n\n---\n\n".join(state["context_chunks"])
    
    total_q = config.get("totalQuestions", 5)
    mcq_count = config.get("mcqCount", 3)
    subj_count = total_q - mcq_count
    
    state["steps_log"].append({
        "type": "generation",
        "message": f"Generating {total_q} questions ({mcq_count} MCQ, {subj_count} Subjective)..."
    })
    logger.info(f"[Agent] Generating exam. Total: {total_q}")
    
    llm, provider = get_llm()
    prompt = get_exam_generation_prompt()
    
    try:
        structured_llm = llm.with_structured_output(ExamOutputSchema)
        chain = prompt | structured_llm
        
        result: ExamOutputSchema = chain.invoke({
            "title": config.get("title", "Exam"),
            "total_questions": total_q,
            "mcq_count": mcq_count,
            "subjective_count": subj_count,
            "difficulty": config.get("difficulty", "medium"),
            "marks_per_mcq": config.get("marksPerMcq", 1),
            "marks_per_subjective": config.get("marksPerSubjective", 5),
            "topic_focus": config.get("topicFocus", "General"),
            "additional_instructions": config.get("additionalInstructions", "None"),
            "context": context_text if context_text else "No specific materials provided. Use general knowledge."
        })
        
        state["questions"] = [q.model_dump() for q in result.questions]
        state["steps_log"].append({
            "type": "info",
            "message": f"Successfully generated {len(state['questions'])} questions."
        })
        return state
        
    except Exception as e:
        logger.warning(f"[Agent] Structured output failed ({provider}): {e}. Falling back to raw JSON parsing.")
    
    try:
        chain = prompt | llm
        
        result = chain.invoke({
            "title": config.get("title", "Exam"),
            "total_questions": total_q,
            "mcq_count": mcq_count,
            "subjective_count": subj_count,
            "difficulty": config.get("difficulty", "medium"),
            "marks_per_mcq": config.get("marksPerMcq", 1),
            "marks_per_subjective": config.get("marksPerSubjective", 5),
            "topic_focus": config.get("topicFocus", "General"),
            "additional_instructions": config.get("additionalInstructions", "None"),
            "context": context_text if context_text else "No specific materials provided. Use general knowledge."
        })
        
        raw_text = result.content if hasattr(result, 'content') else str(result)
        parsed = _parse_json_from_text(raw_text)
        
        # Store raw dicts — normalization happens in format_output node
        if isinstance(parsed, dict) and "questions" in parsed:
            state["questions"] = parsed["questions"]
        elif isinstance(parsed, list):
            state["questions"] = parsed
        else:
            raise ValueError(f"Unexpected JSON structure: {list(parsed.keys())}")
        
        state["steps_log"].append({
            "type": "info",
            "message": f"Successfully generated {len(state['questions'])} questions (via JSON fallback)."
        })
        
    except Exception as e:
        logger.error(f"[Agent] Generation failed completely: {e}")
        state["validation_errors"].append(str(e))
        state["steps_log"].append({
            "type": "error",
            "message": f"Failed to generate questions: {e}"
        })
        
    return state
