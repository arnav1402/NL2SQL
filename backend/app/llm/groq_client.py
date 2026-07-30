from __future__ import annotations

import re

from app.config import GROQ_API_KEY, GROQ_MODEL


def generate_sql(prompt: str) -> str:
    if not GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY is not configured in the environment")

    try:
        from groq import Groq
    except ImportError as exc:  # pragma: no cover - dependency guard
        raise ImportError("The 'groq' package is required. Please install it with 'pip install groq'.") from exc

    client = None
    try:
        client = Groq(api_key=GROQ_API_KEY)
    except TypeError:
        try:
            import httpx

            http_client = httpx.Client(timeout=60.0)
            client = Groq(api_key=GROQ_API_KEY, http_client=http_client)
        except Exception as exc:  # pragma: no cover - dependency guard
            raise RuntimeError(f"Unable to initialize Groq client: {exc}") from exc

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
    )

    content = ""
    if getattr(response, "choices", None):
        first_choice = response.choices[0]
        message = getattr(first_choice, "message", None)
        if message is not None:
            content = getattr(message, "content", "") or ""

    cleaned = re.sub(r"```(?:sql)?", "", content).strip()
    return cleaned
