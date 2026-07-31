from __future__ import annotations


def detect_intent(question: str) -> str:
    normalized = question.lower()
    destructive_phrases = [
        "delete",
        "remove",
        "drop",
        "truncate",
        "update",
        "insert",
        "create",
        "replace",
        "erase",
        "purge",
        "destroy",
        "clear",
        "revoke",
    ]
    for phrase in destructive_phrases:
        if phrase in normalized:
            return "destructive_intent"

    schema_phrases = [
        "summarize",
        "summary of",
        "describe the database",
        "describe the schema",
        "list tables",
        "list all tables",
        "what tables",
        "list columns",
        "list all columns",
        "what columns",
        "show schema",
        "overview of the database",
        "show tables",
    ]
    for phrase in schema_phrases:
        if phrase in normalized:
            return "schema_meta"
    return "sql_query"
