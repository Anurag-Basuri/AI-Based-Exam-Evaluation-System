from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

from config import LLM_TEMPERATURE
from llm_factory import get_llm
from rag.store import VectorStoreManager

router = APIRouter()
vector_store = VectorStoreManager()

class PolicySchema(BaseModel):
    strictness: str = "moderate"
    reviewTone: str = "concise"
    expectedLength: int = 20
    customInstructions: str = ""

class EvaluateRequest(BaseModel):
    question: str
    student_answer: str
    reference_answer: Optional[str] = None
    classroom_id: Optional[str] = None
    policy: Optional[PolicySchema] = None

class EvaluateResponse(BaseModel):
    score: int = Field(ge=0, le=100)
    review: str
    meta: Dict[str, Any]

class EvalOutput(BaseModel):
    score: int = Field(description="The evaluation score from 0 to 100")
    review: str = Field(description="A brief explanation for the score")

EVAL_TEMPLATE = """You are an expert, impartial exam evaluator.
Your task is to score a student's answer based on a given question, an optional reference answer, and relevant course materials.
You must return your evaluation as a JSON object with 'score' (0-100) and 'review' (string).

**TEACHER'S POLICY**
Strictness: {strictness}
Review Tone: {reviewTone}
Expected Length: {expectedLength} words
{customInstructions}

**RELEVANT COURSE MATERIAL (CONTEXT)**
{context}

**QUESTION**
{question}

**REFERENCE ANSWER**
{reference_answer}

**STUDENT'S ANSWER**
{student_answer}

Now, provide your evaluation strictly as JSON.
"""

@router.post("/evaluate", response_model=EvaluateResponse)
async def evaluate_answer(req: EvaluateRequest):
    # 1. Retrieve context if classroom_id is provided
    docs = []
    if req.classroom_id:
        store = vector_store.get_store(req.classroom_id)
        if store:
            docs = store.similarity_search(req.question, k=3)
            
    context_text = "\n\n---\n\n".join([doc.page_content for doc in docs]) if docs else "No course materials provided."
    
    # 2. Setup LLM and parser
    parser = JsonOutputParser(pydantic_object=EvalOutput)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an AI evaluator. Format your output strictly according to the schema:\n{format_instructions}"),
        ("user", EVAL_TEMPLATE)
    ])
    
    # Use the best available LLM for evaluation
    llm, provider = get_llm()
    
    # 3. Apply policy
    policy_dict = req.policy.model_dump() if req.policy else {
        "strictness": "moderate",
        "reviewTone": "concise",
        "expectedLength": 20,
        "customInstructions": ""
    }
    
    try:
        # Fallback for LLMs that don't support structured output perfectly
        if hasattr(llm, "with_structured_output"):
            try:
                structured_llm = llm.with_structured_output(EvalOutput)
                chain = prompt | structured_llm
                result_obj = await chain.ainvoke({
                    "format_instructions": "Return JSON with score and review.",
                    "strictness": policy_dict["strictness"],
                    "reviewTone": policy_dict["reviewTone"],
                    "expectedLength": policy_dict["expectedLength"],
                    "customInstructions": policy_dict["customInstructions"],
                    "context": context_text,
                    "question": req.question,
                    "reference_answer": req.reference_answer or "None provided. Use course material context.",
                    "student_answer": req.student_answer
                })
                # Handle pydantic object vs dict
                if isinstance(result_obj, dict):
                    result = result_obj
                else:
                    result = result_obj.dict()
            except Exception as e:
                print(f"Structured output failed, falling back to JsonOutputParser: {e}")
                chain = prompt | llm | parser
                result = await chain.ainvoke({
                    "format_instructions": parser.get_format_instructions(),
                    "strictness": policy_dict["strictness"],
                    "reviewTone": policy_dict["reviewTone"],
                    "expectedLength": policy_dict["expectedLength"],
                    "customInstructions": policy_dict["customInstructions"],
                    "context": context_text,
                    "question": req.question,
                    "reference_answer": req.reference_answer or "None provided. Use course material context.",
                    "student_answer": req.student_answer
                })
        else:
            chain = prompt | llm | parser
            result = await chain.ainvoke({
                "format_instructions": parser.get_format_instructions(),
                "strictness": policy_dict["strictness"],
                "reviewTone": policy_dict["reviewTone"],
                "expectedLength": policy_dict["expectedLength"],
                "customInstructions": policy_dict["customInstructions"],
                "context": context_text,
                "question": req.question,
                "reference_answer": req.reference_answer or "None provided. Use course material context.",
                "student_answer": req.student_answer
            })
            
        return EvaluateResponse(
            score=result["score"],
            review=result["review"],
            meta={
                "evaluator": "rag-ai",
                "sources_used": len(docs)
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")
