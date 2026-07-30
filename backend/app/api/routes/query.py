from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sqlglot
from sqlalchemy import text

from app.connection import connection_manager
from app.core.exceptions import ConnectionNotFoundError, UnsafeSQLError
from app.llm.groq_client import generate_sql
from app.llm.prompt_builder import build_prompt
from app.vectordb.pinecone import retrieve

router = APIRouter(prefix="/query", tags=["query"])


class QueryRequest(BaseModel):
    connection_id: str
    question: str


class QueryResponse(BaseModel):
    sql: str
    columns: list[str]
    rows: list[dict[str, Any]]


@router.post("", response_model=QueryResponse)
def run_query(payload: QueryRequest) -> QueryResponse:
    try:
        metadata = connection_manager.get_connection(payload.connection_id)
    except ConnectionNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    try:
        connection_manager.update_last_used(payload.connection_id)
        schema_cards = retrieve(payload.question, top_k=5, filter_type="schema", namespace=metadata.namespace)
        prompt = build_prompt(payload.question, [item.get("metadata", {}) for item in schema_cards], dialect=metadata.dialect)
        sql = generate_sql(prompt)

        try:
            parsed = sqlglot.parse_one(sql)
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Invalid SQL: {exc}") from exc

        if not parsed:
            raise HTTPException(status_code=400, detail="No SQL statement was generated")

        expression_type = getattr(parsed, "__class__", type(parsed)).__name__.lower()
        if expression_type != "select" and "select" not in expression_type:
            raise HTTPException(status_code=400, detail="Only SELECT statements are allowed")

        lowered = sql.lower()
        blocked_keywords = ["insert", "update", "delete", "drop", "alter", "create", "truncate"]
        if any(keyword in lowered for keyword in blocked_keywords):
            raise HTTPException(status_code=400, detail="Unsafe SQL keyword detected")

        with metadata.engine.connect() as connection:
            result = connection.execute(text(sql))
            rows = result.fetchall()
            columns = list(result.keys())
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Query execution failed: {exc}") from exc

    return QueryResponse(sql=sql, columns=columns, rows=[dict(zip(columns, row)) for row in rows])
