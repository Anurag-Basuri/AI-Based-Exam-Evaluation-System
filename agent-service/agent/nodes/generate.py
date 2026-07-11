"""
Generate Node for initial exam creation.
"""

import logging
from pydantic import BaseModel, Field

from agent.state import AgentState, QuestionDraft
from llm_factory import get_llm
from prompts.exam_generation import get_exam_generation_prompt

logger = logging.getLogger(__name__)

class ExamOutputSchema(BaseModel):
    questions: list[QuestionDraft] = Field(description="The list of generated questions")

def generate_node(state: AgentState) -> AgentState:
    """
    Calls the LLM to generate the exam based on config and context.
    Uses structured output to guarantee JSON schema adherence.
    """
    config = state["config"]
    context_text = "\n\n---\n\n".join(state["context_chunks"])
    
    # Extract config vars
    total_q = config.get("totalQuestions", 5)
    mcq_count = config.get("mcqCount", 3)
    subj_count = total_q - mcq_count
    
    state["steps_log"].append({
        "type": "generation",
        "message": f"Generating {total_q} questions ({mcq_count} MCQ, {subj_count} Subjective)..."
    })
    logger.info(f"[Agent] Generating exam. Total: {total_q}")
    
    llm, provider = get_llm()
    
    # Try to use structured output (most modern LangChain LLMs support this)
    try:
        structured_llm = llm.with_structured_output(ExamOutputSchema)
    except NotImplementedError:
        logger.warning(f"[Agent] Provider {provider} does not support with_structured_output natively. Falling back.")
        # Some older/basic providers don't support it directly. For production we assume Groq/Gemini/OpenAI do.
        structured_llm = llm.with_structured_output(ExamOutputSchema, method="json_mode")
    
    prompt = get_exam_generation_prompt()
    chain = prompt | structured_llm
    
    try:
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
        
        # Convert pydantic models to dicts for state
        state["questions"] = [q.model_dump() for q in result.questions]
        state["steps_log"].append({
            "type": "info",
            "message": f"Successfully generated {len(state['questions'])} questions."
        })
        
    except Exception as e:
        logger.error(f"[Agent] Generation failed: {e}")
        state["validation_errors"].append(str(e))
        state["steps_log"].append({
            "type": "error",
            "message": f"Failed to generate questions: {e}"
        })
        
    return state
