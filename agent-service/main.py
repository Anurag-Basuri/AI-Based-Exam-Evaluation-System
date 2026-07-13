"""
Agent Service — FastAPI Application
Entry point for the Python microservice that powers AI exam generation and evaluation.
"""

import logging
import time
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from config import AGENT_HOST, AGENT_PORT, get_available_providers, CHROMA_PERSIST_DIR
from llm_factory import get_llm, reset_llm_cache, LLMProviderExhaustedError
from rag.embedder import process_and_store_document
from session.models import CreateSessionRequest, SendMessageRequest
from session.manager import session_manager
from routers.evaluate import router as evaluate_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("agent-service")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown logic."""
    logger.info("🚀 Agent Service starting...")
    logger.info(f"📂 ChromaDB persist dir: {CHROMA_PERSIST_DIR}")

    # Log available providers
    providers = get_available_providers()
    for p in providers:
        status = "✅ configured" if p["configured"] else "⬜ not configured"
        logger.info(f"   LLM [{p['name']}] {p['model']} — {status}")

    configured_count = sum(1 for p in providers if p["configured"])
    if configured_count == 0:
        logger.warning("⚠️  No LLM providers configured! Set at least one API key in .env")
    else:
        logger.info(f"   {configured_count} provider(s) ready in fallback chain")

    yield

    logger.info("Agent Service shutting down.")


app = FastAPI(
    title="AI Exam Agent Service",
    description="LangGraph-powered exam generation and evaluation agent",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8000", "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(evaluate_router, prefix="/api/v1/ai", tags=["Evaluate"])


class HealthResponse(BaseModel):
    status: str
    uptime_seconds: float
    providers: list[dict]
    active_provider: Optional[str] = None
    error: Optional[str] = None

_start_time = time.time()

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint with LLM provider status."""
    providers = get_available_providers()
    active = None
    error = None

    try:
        _, provider_name = get_llm()
        active = provider_name
    except LLMProviderExhaustedError as e:
        error = str(e)

    return HealthResponse(
        status="healthy" if active else "degraded",
        uptime_seconds=round(time.time() - _start_time, 2),
        providers=providers,
        active_provider=active,
        error=error,
    )


@app.post("/providers/reset")
async def reset_providers():
    """Force re-evaluation of the LLM fallback chain."""
    reset_llm_cache()
    try:
        _, name = get_llm()
        return {"status": "ok", "active_provider": name}
    except LLMProviderExhaustedError as e:
        raise HTTPException(status_code=503, detail=str(e))


class EmbedRequest(BaseModel):
    classroom_id: str
    doc_id: str
    file_url: str
    original_name: str

@app.post("/embed")
async def embed_document(req: EmbedRequest):
    """Embed a document into ChromaDB for RAG retrieval."""
    try:
        result = await process_and_store_document(
            req.classroom_id, req.doc_id, req.file_url, req.original_name
        )
        return result
    except Exception as e:
        logger.error(f"Embed failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class DeleteEmbedRequest(BaseModel):
    classroom_id: str
    doc_id: str

@app.delete("/embed")
async def delete_embedding(req: DeleteEmbedRequest):
    """Remove a document's embeddings from ChromaDB."""
    from rag.store import store
    try:
        store.delete_document(req.classroom_id, req.doc_id)
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Delete embed failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


from sse_starlette.sse import EventSourceResponse
import json

@app.post("/sessions")
async def create_session(req: CreateSessionRequest):
    """Create a new agent session."""
    try:
        session_id = session_manager.create_session(req)
        return {"status": "success", "session_id": session_id}
    except Exception as e:
        logger.error(f"Session creation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/sessions/{session_id}/generate/stream")
async def stream_generate(session_id: str):
    """Stream the generation process via SSE."""
    
    async def event_generator():
        async for event in session_manager.run_generate(session_id):
            yield {
                "event": event["event"],
                "data": json.dumps(event["data"]) if isinstance(event["data"], (dict, list)) else event["data"]
            }
            
    return EventSourceResponse(event_generator())

@app.post("/sessions/{session_id}/message")
async def send_message(session_id: str, req: SendMessageRequest):
    """Refine session based on a message from the teacher."""
    
    async def event_generator():
        async for event in session_manager.run_refine(session_id, req.content):
            yield {
                "event": event["event"],
                "data": json.dumps(event["data"]) if isinstance(event["data"], (dict, list)) else event["data"]
            }
            
    return EventSourceResponse(event_generator())

@app.get("/sessions/{session_id}")
async def get_session(session_id: str):
    """Get current session state and draft."""
    state = session_manager.get_session(session_id)
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")
        
    return {
        "session_id": state["session_id"],
        "draft": state.get("questions", []),
        "messages": state.get("messages", []),
        "used_chunk_ids": state.get("used_chunk_ids", [])
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=AGENT_HOST,
        port=AGENT_PORT,
        reload=False,
        log_level="info",
    )
