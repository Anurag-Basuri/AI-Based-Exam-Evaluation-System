"""
Evaluation Router — Strict RAG-based Answer Evaluation.

Evaluation logic:
- Manual Exams: Uses the teacher's attached material_ids to filter ChromaDB search.
- AI-Generated Exams: Uses the exact doc_ids that the AI used during exam generation.
- No external knowledge is allowed. The LLM prompt strictly enforces reference-only grading.
"""

import json
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

from llm_factory import get_llm
from rag.store import store
from prompts.evaluation import get_evaluation_prompt

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Request / Response Schemas ──

class PolicySchema(BaseModel):
    strictness: str = "moderate"       # lenient | moderate | strict
    reviewTone: str = "concise"        # concise | detailed | encouraging
    expectedLength: int = 30           # approximate word count for review
    customInstructions: str = ""       # any teacher-specific grading notes

class EvaluateRequest(BaseModel):
    question: str
    student_answer: str
    max_marks: int = 100
    reference_answer: Optional[str] = None
    classroom_id: Optional[str] = None
    # Strict filtering: only these doc IDs are searchable in ChromaDB
    allowed_doc_ids: Optional[List[str]] = None
    # Whether this exam was manual or AI-created
    exam_type: str = "manual"   # "manual" | "ai"
    policy: Optional[PolicySchema] = None

class EvaluateResponse(BaseModel):
    score: int = Field(ge=0)
    review: str
    meta: Dict[str, Any]


@router.post("/evaluate", response_model=EvaluateResponse)
async def evaluate_answer(req: EvaluateRequest):
    """
    Evaluate a student's subjective answer using strict RAG.
    
    The evaluation ONLY uses:
    1. The reference_answer (if provided by the teacher)
    2. ChromaDB chunks filtered by allowed_doc_ids (if provided)
    
    No outside knowledge is used.
    """
    
    # 1. Retrieve strictly-scoped context from ChromaDB
    context_text = ""
    sources_used = 0
    
    if req.classroom_id and req.allowed_doc_ids:
        # Search ONLY within the allowed documents
        results = store.search(
            classroom_id=req.classroom_id,
            query=req.question,
            n_results=5,
            doc_ids=req.allowed_doc_ids
        )
        sources_used = len(results)
        
        if results:
            context_text = "\n\n---\n\n".join([
                f"[Source: {r.get('metadata', {}).get('source', 'unknown')}]\n{r['text']}"
                for r in results
            ])
    
    if not context_text:
        context_text = "No course materials available for this evaluation."
    
    # 2. Setup policy
    policy = req.policy or PolicySchema()
    custom_instr = f"Additional Instructions: {policy.customInstructions}" if policy.customInstructions else ""
    
    # 3. Build the chain
    llm, provider = get_llm()
    prompt = get_evaluation_prompt()
    
    # 4. Invoke
    try:
        response = await llm.ainvoke(
            prompt.format_messages(
                strictness=policy.strictness,
                review_tone=policy.reviewTone,
                expected_length=policy.expectedLength,
                custom_instructions=custom_instr,
                context=context_text,
                reference_answer=req.reference_answer or "No model answer provided by teacher.",
                question=req.question,
                student_answer=req.student_answer,
                max_marks=req.max_marks
            )
        )
        
        # Parse the JSON from the LLM response
        raw_text = response.content.strip()
        
        # Handle potential markdown wrapping
        if raw_text.startswith("```"):
            lines = raw_text.split("\n")
            # Remove first and last lines (```json and ```)
            lines = [l for l in lines if not l.strip().startswith("```")]
            raw_text = "\n".join(lines)
        
        result = json.loads(raw_text)
        
        # Clamp score to valid range
        score = max(0, min(req.max_marks, int(result.get("score", 0))))
        review = result.get("review", "No review provided.")
        
        return EvaluateResponse(
            score=score,
            review=review,
            meta={
                "evaluator": "strict-rag-ai",
                "provider": provider,
                "exam_type": req.exam_type,
                "sources_used": sources_used,
                "allowed_doc_ids": req.allowed_doc_ids or [],
                "had_reference_answer": bool(req.reference_answer),
            }
        )
        
    except json.JSONDecodeError as e:
        logger.error(f"[Eval] Failed to parse LLM JSON output: {e}\nRaw: {raw_text[:500]}")
        raise HTTPException(status_code=500, detail=f"LLM returned invalid JSON: {e}")
    except Exception as e:
        logger.error(f"[Eval] Evaluation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")
