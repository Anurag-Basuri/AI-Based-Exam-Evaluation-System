from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import ingest, query, evaluate, generate

app = FastAPI(
    title="RAG AI Evaluation Service",
    description="Python microservice for context-aware exam evaluation using LangChain and Gemini",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for now, restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingest.router, prefix="/api/v1/ai", tags=["Ingest"])
app.include_router(query.router, prefix="/api/v1/ai", tags=["Query"])
app.include_router(evaluate.router, prefix="/api/v1/ai", tags=["Evaluate"])
app.include_router(generate.router, prefix="/api/v1/ai", tags=["Generate"])

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy", "service": "ai-service"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
