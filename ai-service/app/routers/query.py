from fastapi import APIRouter, HTTPException
from langchain_core.prompts import ChatPromptTemplate
from app.models.schemas import QueryRequest, QueryResponse, SourceChunk
from app.services.rag_service import retrieve_context
from app.services.llm_service import get_llm

router = APIRouter()

SYSTEM_TEMPLATE = """You are a helpful AI Study Assistant. Answer the user's question based strictly on the provided context materials.
If the answer cannot be found in the context, say "I don't have enough information in the provided course materials to answer that."
Do not use outside knowledge.

Context:
{context}
"""

@router.post("/query", response_model=QueryResponse)
async def query_assistant(req: QueryRequest):
    docs = retrieve_context(exam_id=req.exam_id, teacher_id=req.teacher_id, query=req.query, top_k=5)
    
    context_text = "\n\n---\n\n".join([doc.page_content for doc in docs])
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_TEMPLATE),
        ("user", "{question}")
    ])
    
    llm = get_llm(temperature=0.2)
    chain = prompt | llm
    
    try:
        response = chain.invoke({
            "context": context_text,
            "question": req.query
        })
        
        sources = [
            SourceChunk(content=doc.page_content, metadata=doc.metadata) 
            for doc in docs
        ]
        
        return QueryResponse(
            answer=response.content,
            sources=sources
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating answer: {str(e)}")
