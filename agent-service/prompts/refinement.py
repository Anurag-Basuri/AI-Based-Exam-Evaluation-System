"""
Prompt templates for Exam Refinement.
"""

from langchain_core.prompts import ChatPromptTemplate

EXAM_REFINEMENT_SYSTEM_PROMPT = """You are an expert exam creator and educator.
The teacher has requested modifications to an existing draft exam. 
You must output a NEW list of questions that incorporates their requested changes.

ORIGINAL DRAFT EXAM QUESTIONS:
{current_draft}

CONTEXT MATERIALS (for reference if adding new questions):
{context}

TEACHER'S REQUEST:
{request}

INSTRUCTIONS:
1. Return the complete updated list of questions.
2. Maintain the structure and properties of any questions that were NOT requested to be changed.
3. For modified or new questions, ensure they follow the standard schema (4 options for MCQs, model answer for subjective).
4. Output MUST be valid JSON matching the exact schema requested.
"""

def get_exam_refinement_prompt():
    return ChatPromptTemplate.from_messages([
        ("system", EXAM_REFINEMENT_SYSTEM_PROMPT),
        ("user", "Apply the changes and return the updated questions JSON.")
    ])
