"""
Configuration for the Agent Service.
Loads environment variables and defines the LLM provider fallback chain.
"""

import os
from dotenv import load_dotenv

load_dotenv()

AGENT_HOST: str = os.getenv("AGENT_SERVICE_HOST", "0.0.0.0")
AGENT_PORT: int = int(os.getenv("AGENT_SERVICE_PORT", "8001"))
NODE_BACKEND_URL: str = os.getenv("NODE_BACKEND_URL", "http://localhost:5000")

CHROMA_PERSIST_DIR: str = os.getenv("CHROMA_PERSIST_DIR", "./chroma_data")
EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
LLM_TEMPERATURE: float = float(os.getenv("LLM_TEMPERATURE", "0.3"))
LLM_MAX_TOKENS: int = int(os.getenv("LLM_MAX_TOKENS", "4096"))

def get_available_providers() -> list[dict]:
    """Return only providers that have an API key configured."""
    keys = [
        {"name": "groq", "env": "GROQ_API_KEY", "model": "llama-3.3-70b-versatile"},
        {"name": "cerebras", "env": "CEREBRAS_API_KEY", "model": "gpt-oss-120b"},
        {"name": "openrouter", "env": "OPENROUTER_API_KEY", "model": "openrouter/free"},
        {"name": "huggingface", "env": "HF_API_KEY", "model": "Qwen/Qwen2.5-72B-Instruct"},
    ]
    
    available = []
    for k in keys:
        has_key = bool(os.getenv(k["env"]))
        available.append({
            "name": k["name"],
            "model": k["model"],
            "configured": has_key
        })
    return available
