"""
LLM Factory with automatic fallback chain.
Tries each configured provider in priority order.
Returns the first working LLM instance.
"""

import os
import logging
from typing import Tuple, Optional

from langchain_core.language_models.chat_models import BaseChatModel

from config import LLM_PROVIDERS, LLM_TEMPERATURE, LLM_MAX_TOKENS

logger = logging.getLogger(__name__)


def _build_llm(provider: dict, api_key: str) -> BaseChatModel:
    """Instantiate a LangChain chat model for the given provider config."""

    if provider["type"] == "google_genai":
        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(
            model=provider["model"],
            google_api_key=api_key,
            temperature=LLM_TEMPERATURE,
            max_output_tokens=LLM_MAX_TOKENS,
        )

    if provider["type"] == "huggingface":
        # Use the OpenAI-compatible HF Router endpoint for better compatibility
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(
            model=provider["model"],
            api_key=api_key,
            base_url="https://router.huggingface.co/v1",
            temperature=LLM_TEMPERATURE,
            max_tokens=LLM_MAX_TOKENS,
        )

    # Default: OpenAI-compatible (Groq, OpenRouter, Cerebras, etc.)
    from langchain_openai import ChatOpenAI
    return ChatOpenAI(
        model=provider["model"],
        api_key=api_key,
        base_url=provider.get("base_url"),
        temperature=LLM_TEMPERATURE,
        max_tokens=LLM_MAX_TOKENS,
    )


def get_llm_with_fallback(skip_health_check: bool = False) -> Tuple[BaseChatModel, str]:
    """
    Try each provider in the fallback chain.
    Returns (llm_instance, provider_name).
    Raises RuntimeError if all providers fail.
    """
    errors = []

    for provider in LLM_PROVIDERS:
        api_key = os.getenv(provider["api_key_env"])
        if not api_key:
            logger.debug(f"[LLM] Skipping {provider['name']}: no API key configured")
            continue

        try:
            llm = _build_llm(provider, api_key)

            if not skip_health_check:
                # Quick validation: invoke with a trivial prompt
                llm.invoke("Respond with OK")

            logger.info(f"[LLM] ✅ Using provider: {provider['name']} ({provider['model']})")
            return llm, provider["name"]

        except Exception as e:
            msg = f"{provider['name']}: {type(e).__name__}: {e}"
            logger.warning(f"[LLM] ❌ Provider failed — {msg}")
            errors.append(msg)
            continue

    error_summary = "\n".join(f"  • {err}" for err in errors) if errors else "  No providers configured."
    raise RuntimeError(
        f"All LLM providers exhausted. Configure at least one API key.\n{error_summary}"
    )


def get_llm_lazy() -> Tuple[BaseChatModel, str]:
    """
    Same as get_llm_with_fallback but skips the health check.
    Use this when you want to defer the first real call to actual usage.
    """
    return get_llm_with_fallback(skip_health_check=True)


# ── Cached singleton ──
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
