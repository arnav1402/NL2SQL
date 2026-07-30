from __future__ import annotations


def build_prompt(user_question: str, schema_cards: list[dict], dialect: str) -> str:
    if not schema_cards:
        schema_context = "No schema context was retrieved."
    else:
        schema_context = "\n\n".join(card.get("text", "") for card in schema_cards)

    return (
        "You are an expert SQL generator. Use only the schema context provided below. "
        "Do not invent tables, columns, aliases, or functions. "
        "Return only one raw SQL SELECT statement and nothing else.\n\n"
        "Rules:\n"
        "- Use only tables and columns that appear in the schema context.\n"
        "- Prefer simple SELECT statements.\n"
        "- Do not use JOINs unless clearly supported by the schema.\n"
        "- Do not include explanations, comments, markdown fences, or extra text.\n"
        f"Dialect: {dialect}\n\n"
        f"Schema context:\n{schema_context}\n\n"
        f"User question: {user_question}\n\n"
        "SQL:"
    )
