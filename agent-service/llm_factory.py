"""
LLM Factory with automatic fallback chain.
Tries each configured provider in priority order.
Returns the first working LLM instance.
"""

import os
import logging
from typing import Tuple, Optional

from langchain_core.language_models.chat_models import BaseChatModel

from config import LLM_TEMPERATURE, LLM_MAX_TOKENS

class LLMProviderExhaustedError(Exception):
    """Raised when no LLM providers are available or functioning."""
    pass

logger = logging.getLogger(__name__)


def _build_llm(provider: str, api_key: str) -> BaseChatModel:
    """Instantiate a LangChain chat model for the given provider."""
    if provider == "gemini":
        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            google_api_key=api_key,
            temperature=LLM_TEMPERATURE,
            max_output_tokens=LLM_MAX_TOKENS,
        )

    from langchain_openai import ChatOpenAI

    if provider == "groq":
        return ChatOpenAI(
            model="llama-3.3-70b-versatile",
            api_key=api_key,
            base_url="https://api.groq.com/openai/v1",
            temperature=LLM_TEMPERATURE,
            max_tokens=LLM_MAX_TOKENS,
        )

    if provider == "openai":
        return ChatOpenAI(
            model="gpt-4o-mini",
            api_key=api_key,
            temperature=LLM_TEMPERATURE,
            max_tokens=LLM_MAX_TOKENS,
        )

    if provider == "cerebras":
        return ChatOpenAI(
            model="llama-3.3-70b",
            api_key=api_key,
            base_url="https://api.cerebras.ai/v1",
            temperature=LLM_TEMPERATURE,
            max_tokens=LLM_MAX_TOKENS,
        )

    if provider == "openrouter":
        return ChatOpenAI(
            model="meta-llama/llama-3.3-70b-instruct:free",
            api_key=api_key,
            base_url="https://openrouter.ai/api/v1",
            temperature=LLM_TEMPERATURE,
            max_tokens=LLM_MAX_TOKENS,
        )

    if provider == "huggingface":
        return ChatOpenAI(
            model="Qwen/Qwen2.5-72B-Instruct",
            api_key=api_key,
            base_url="https://router.huggingface.co/v1",
            temperature=LLM_TEMPERATURE,
            max_tokens=LLM_MAX_TOKENS,
        )

    raise ValueError(f"Unknown LLM provider: {provider}")


def get_llm_with_fallback(skip_health_check: bool = False) -> Tuple[BaseChatModel, str]:
    """
    Try each provider in sequential priority order.
    Returns (llm_instance, provider_name).
    """
    providers = [
        ("gemini", "GEMINI_API_KEY"),
        ("groq", "GROQ_API_KEY"),
        ("openai", "OPENAI_API_KEY"),
        ("cerebras", "CEREBRAS_API_KEY"),
        ("openrouter", "OPENROUTER_API_KEY"),
        ("huggingface", "HF_API_KEY"),
    ]

    errors = []

    for name, env_var in providers:
        api_key = os.getenv(env_var)
        if not api_key:
            continue

        try:
            llm = _build_llm(name, api_key)
            if not skip_health_check:
                llm.invoke("Respond with OK")
            logger.info(f"[LLM] ✅ Using provider: {name}")
            return llm, name
        except Exception as e:
            msg = f"{name}: {type(e).__name__}: {e}"
            logger.warning(f"[LLM] ❌ Provider {name} failed — {msg}")
            errors.append(msg)

    error_summary = "\n".join(f"  • {err}" for err in errors) if errors else "  No providers configured."
    raise LLMProviderExhaustedError(
        f"All LLM providers exhausted. Configure at least one API key.\n{error_summary}"
    )


def get_llm_lazy() -> Tuple[BaseChatModel, str]:
    """
    Same as get_llm_with_fallback but skips the health check.
    Use this when you want to defer the first real call to actual usage.
    """
    return get_llm_with_fallback(skip_health_check=True)


_cached_llm: Optional[Tuple[BaseChatModel, str]] = None


def get_llm() -> Tuple[BaseChatModel, str]:
    """
    Returns a cached LLM instance. Re-creates on failure.
    Thread-safe for FastAPI's async model (single process).
    """
    global _cached_llm
    if _cached_llm is not None:
        return _cached_llm

    _cached_llm = get_llm_lazy()
    return _cached_llm


def reset_llm_cache():
    """Force re-evaluation of the fallback chain on next call."""
    global _cached_llm
    _cached_llm = None
