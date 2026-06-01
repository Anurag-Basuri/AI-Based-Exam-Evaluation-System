from fastapi import APIRouter, HTTPException
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from typing import List
from app.models.schemas import GenerateRequest, GenerateResponse, GeneratedQuestion
from app.services.rag_service import retrieve_context
from app.services.llm_service import get_llm

router = APIRouter()

GENERATE_TEMPLATE = """You are an expert exam question generator.
Based on the following course materials, generate {count} questions of difficulty '{difficulty}'.
The question type should be '{question_type}' (if mixed, provide a mix of multiple-choice and subjective).
Format your output strictly according to the schema.

**COURSE MATERIAL (CONTEXT)**
{context}

Now, generate the questions.
"""

@router.post("/generate-questions", response_model=GenerateResponse)
async def generate_questions(req: GenerateRequest):
    # Retrieve broadly across the exam's context
    docs = retrieve_context(exam_id=req.exam_id, query="Summarize core concepts for exam questions", top_k=10)
    context_text = "\n\n---\n\n".join([doc.page_content for doc in docs]) if docs else "No course materials provided."
    
    if not docs:
        raise HTTPException(status_code=400, detail="No course materials found for this exam to generate questions from.")
        
    parser = JsonOutputParser(pydantic_object=GenerateResponse)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an AI question generator. Format your output strictly according to the schema:\n{format_instructions}"),
        ("user", GENERATE_TEMPLATE)
    ])
    
    llm = get_llm(temperature=0.7)
    chain = prompt | llm | parser
    
    try:
        result = chain.invoke({
            "format_instructions": parser.get_format_instructions(),
            "count": req.count,
            "difficulty": req.difficulty,
            "question_type": req.question_type,
            "context": context_text
        })
        
        return GenerateResponse(questions=result["questions"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")
