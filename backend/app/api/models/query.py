from __future__ import annotations

from typing import Any

from pydantic import BaseModel


class QueryRequest(BaseModel):
    connection_id: str
    question: str


class QueryResponse(BaseModel):
    sql: str
    columns: list[str]
    rows: list[dict[str, Any]]
