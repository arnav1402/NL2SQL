from __future__ import annotations

import re
from typing import TYPE_CHECKING

from app.config import GROQ_API_KEY, GROQ_MODEL
from app.core.exceptions import LLMGenerationError
from app.utils.logger import logger

if TYPE_CHECKING:
    from groq import Groq


def generate_sql(prompt: str) -> str:
    if not GROQ_API_KEY:
        raise LLMGenerationError("GROQ_API_KEY is not configured in the environment")

    try:
        from groq import Groq
    except ImportError as exc:  # pragma: no cover - dependency guard
        raise LLMGenerationError("The 'groq' package is required. Please install it with 'pip install groq'.") from exc

    client = None
    try:
        client = Groq(api_key=GROQ_API_KEY)
    except TypeError:
        try:
            import httpx

            http_client = httpx.Client(timeout=60.0)
            client = Groq(api_key=GROQ_API_KEY, http_client=http_client)
        except Exception as exc:  # pragma: no cover - dependency guard
            raise LLMGenerationError(f"Unable to initialize Groq client: {exc}") from exc
    except Exception as exc:
        raise LLMGenerationError(f"Unable to initialize Groq client: {exc}") from exc

    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are a SQL generator. Return ONLY raw SQL with no explanation or markdown fences.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0,
            timeout=60.0,
        )
    except Exception as exc:
        logger.error("Groq generation failed", exc_info=exc)
        raise LLMGenerationError(f"Groq generation failed: {exc}") from exc

    content = ""
    if getattr(response, "choices", None):
        first_choice = response.choices[0]
        message = getattr(first_choice, "message", None)
        if message is not None:
            content = getattr(message, "content", "") or ""

    cleaned = re.sub(r"```(?:sql)?", "", content).strip()
    return cleaned


def summarize_schema(schema_cards: list[dict], question: str) -> str:
    if not GROQ_API_KEY:
        raise LLMGenerationError("GROQ_API_KEY is not configured in the environment")

    try:
        from groq import Groq
    except ImportError as exc:  # pragma: no cover - dependency guard
        raise LLMGenerationError("The 'groq' package is required. Please install it with 'pip install groq'.") from exc

    client = None
    try:
        client = Groq(api_key=GROQ_API_KEY)
    except TypeError:
        try:
            import httpx

            http_client = httpx.Client(timeout=60.0)
            client = Groq(api_key=GROQ_API_KEY, http_client=http_client)
        except Exception as exc:  # pragma: no cover - dependency guard
            raise LLMGenerationError(f"Unable to initialize Groq client: {exc}") from exc
    except Exception as exc:
        raise LLMGenerationError(f"Unable to initialize Groq client: {exc}") from exc

    schema_text = "\n\n".join(card.get("metadata", {}).get("text", "") for card in schema_cards)
    prompt = (
        "You are a schema summarization assistant. Provide a concise, plain-English description of the database schema "
        "based on the schema cards below. Do not generate SQL. Focus on table names, column names, and relationships. "
        "Match the level of detail to the user question."
        f"\n\nQuestion: {question}\n\n"
        f"Schema cards:\n{schema_text}"
    )

    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": "You are a schema summarization assistant."},
                {"role": "user", "content": prompt},
            ],
            temperature=0,
            timeout=60.0,
        )
    except Exception as exc:
        logger.error("Groq schema summarization failed", exc_info=exc)
        raise LLMGenerationError(f"Groq schema summarization failed: {exc}") from exc

    content = ""
    if getattr(response, "choices", None):
        first_choice = response.choices[0]
        message = getattr(first_choice, "message", None)
        if message is not None:
            content = getattr(message, "content", "") or ""

    return content.strip()
