from fastapi import APIRouter, HTTPException
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
from app.models.schemas import EvaluateRequest, EvaluateResponse
from app.services.rag_service import retrieve_context
from app.services.llm_service import get_llm

router = APIRouter()

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
    docs = retrieve_context(exam_id=req.exam_id, query=req.question, top_k=3)
    context_text = "\n\n---\n\n".join([doc.page_content for doc in docs]) if docs else "No course materials provided."
    
    parser = JsonOutputParser(pydantic_object=EvalOutput)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an AI evaluator. Format your output strictly according to the schema:\n{format_instructions}"),
        ("user", EVAL_TEMPLATE)
    ])
    
    llm = get_llm(temperature=0.1)
    chain = prompt | llm | parser
    
    policy_dict = req.policy.model_dump() if req.policy else {
        "strictness": "moderate",
        "reviewTone": "concise",
        "expectedLength": 20,
        "customInstructions": ""
    }
    
    try:
        result = chain.invoke({
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
