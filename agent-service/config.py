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

from typing import List, Dict, Any

LLM_PROVIDERS: List[Dict[str, Any]] = [
    {
        "name": "groq",
        "api_key_env": "GROQ_API_KEY",
        "model": "llama-3.3-70b-versatile",
        "base_url": "https://api.groq.com/openai/v1",
        "type": "openai_compatible",
    },
    {
        "name": "gemini",
        "api_key_env": "GEMINI_API_KEY",
        "model": "gemini-2.0-flash",
        "base_url": None,
        "type": "google_genai",
    },
    {
        "name": "openrouter",
        "api_key_env": "OPENROUTER_API_KEY",
        "model": "meta-llama/llama-3.3-70b-instruct:free",
        "base_url": "https://openrouter.ai/api/v1",
        "type": "openai_compatible",
    },
    {
        "name": "huggingface",
        "api_key_env": "HF_API_KEY",
        "model": "Qwen/Qwen2.5-72B-Instruct",
        "base_url": None,
        "type": "huggingface",
    },
]

_cerebras_key = os.getenv("CEREBRAS_API_KEY")
if _cerebras_key:
    LLM_PROVIDERS.insert(1, {
        "name": "cerebras",
        "api_key_env": "CEREBRAS_API_KEY",
        "model": "llama-3.3-70b",
        "base_url": "https://api.cerebras.ai/v1",
        "type": "openai_compatible",
    })


def get_available_providers() -> list[dict]:
    """Return only providers that have an API key configured."""
    available = []
    for p in LLM_PROVIDERS:
        key = os.getenv(p["api_key_env"])
        available.append({
            "name": p["name"],
            "model": p["model"],
            "configured": bool(key),
        })
    return available
