from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.exc import DatabaseError, OperationalError

from app.connection import connection_manager
from app.core.exceptions import (
    AmbiguousQuestionError,
    ConnectionNotFoundError,
    DatabaseExecutionError,
    LLMGenerationError,
    UnsafeSQLError,
    VectorStoreError,
)
from app.config import MAX_RESULT_ROWS, MIN_RETRIEVAL_SCORE
from app.llm.groq_client import generate_sql, summarize_schema
from app.llm.prompt_builder import build_prompt
from app.pipeline.orchestrator import detect_intent
from app.pipeline.validator import validate_sql
from app.utils.logger import logger, query_logger
from app.vectordb.pinecone import get_all_schema_cards, retrieve

router = APIRouter(prefix="/query", tags=["query"])


def _serialize_value(value: Any) -> Any:
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return str(value)
    if isinstance(value, UUID):
        return str(value)
    if isinstance(value, (bytes, bytearray)):
        try:
            return value.decode("utf-8")
        except Exception:
            import base64

            return base64.b64encode(bytes(value)).decode("utf-8")
    return value


def _serialize_row(row: dict[str, Any]) -> dict[str, Any]:
    return {key: _serialize_value(value) for key, value in row.items()}


class QueryRequest(BaseModel):
    connection_id: str
    question: str


class QueryResponse(BaseModel):
    sql: str
    columns: list[str]
    rows: list[dict[str, Any]]


@router.post("")
def run_query(payload: QueryRequest) -> dict:
    try:
        metadata = connection_manager.get_connection(payload.connection_id)
        connection_manager.update_last_used(payload.connection_id)

        intent = detect_intent(payload.question)
        if intent == "destructive_intent":
            raise UnsafeSQLError(
                "Destructive query intent detected. Only read-only SELECT queries are permitted."
            )

        if intent == "schema_meta":
            schema_cards = get_all_schema_cards(metadata.namespace)
            if not schema_cards:
                raise AmbiguousQuestionError(
                    "Couldn't confidently match your question to any table in this database. Try rephrasing or being more specific about what data you're asking about."
                )
            summary = summarize_schema(schema_cards, payload.question)
            query_logger.info(
                "Schema summary generated",
                extra={"connection_id": payload.connection_id, "question": payload.question, "result_type": "schema_summary"},
            )
            return {"type": "schema_summary", "answer": summary}

        schema_cards = retrieve(payload.question, top_k=5, filter_type="schema", namespace=metadata.namespace)
        if not schema_cards or all((card.get("score") or 0) < MIN_RETRIEVAL_SCORE for card in schema_cards):
            raise AmbiguousQuestionError(
                "Couldn't confidently match your question to any table in this database. Try rephrasing or being more specific about what data you're asking about."
            )

        prompt = build_prompt(payload.question, [item.get("metadata", {}) for item in schema_cards], dialect=metadata.dialect)

        attempt = 1
        max_attempts = 3
        sql = ""
        while True:
            sql = generate_sql(prompt)
            logger.info(
                "Query received",
                extra={"connection_id": payload.connection_id, "question": payload.question},
            )
            logger.info(
                f"Query generated: {sql}",
                extra={"connection_id": payload.connection_id, "question": payload.question},
            )
            query_logger.info(
                f"Query generated: {sql}",
                extra={"connection_id": payload.connection_id, "question": payload.question, "sql": sql},
            )

            valid, reason = validate_sql(sql, metadata.engine, metadata.dialect)
            if not valid:
                if reason.startswith("This query references something that doesn't exist in the database") and attempt < max_attempts:
                    prompt += f"\n\nThe previous SQL failed EXPLAIN with: {reason}. Please correct the SQL and return only a valid SELECT statement."
                    attempt += 1
                    continue
                raise UnsafeSQLError(reason)

            try:
                with metadata.engine.connect() as connection:
                    result = connection.execute(text(sql))
                    fetched_rows = result.fetchmany(MAX_RESULT_ROWS + 1)
                    columns = list(result.keys())
                    truncated = len(fetched_rows) > MAX_RESULT_ROWS
                    displayed_rows = fetched_rows[:MAX_RESULT_ROWS]
                    row_dicts = [dict(row._mapping if hasattr(row, '_mapping') else row) for row in displayed_rows]
                    serialized_rows = [_serialize_row(row_dict) for row_dict in row_dicts]
                    row_count = len(serialized_rows)
                    total_rows_available = None
                    if truncated:
                        total_rows_available = MAX_RESULT_ROWS + 1
                    logger.info(
                        "Query executed successfully",
                        extra={"connection_id": payload.connection_id, "sql": sql, "row_count": row_count, "truncated": truncated},
                    )
                    query_logger.info(
                        "Query executed successfully",
                        extra={"connection_id": payload.connection_id, "sql": sql, "row_count": row_count, "truncated": truncated},
                    )
                break
            except (OperationalError, DatabaseError) as exc:
                raise DatabaseExecutionError(str(exc)) from exc
            except Exception as exc:
                raise DatabaseExecutionError(str(exc)) from exc

    except HTTPException:
        raise
    except ConnectionNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except AmbiguousQuestionError as exc:
        logger.warning("Ambiguous question rejected", exc_info=exc, extra={"connection_id": payload.connection_id})
        raise HTTPException(status_code=400, detail={"error": "Too ambiguous to generate SQL", "detail": str(exc)}) from exc
    except VectorStoreError as exc:
        logger.error("Upstream vector store error", exc_info=exc, extra={"connection_id": payload.connection_id})
        raise HTTPException(status_code=503, detail={"error": "VectorStoreError", "detail": str(exc)}) from exc
    except LLMGenerationError as exc:
        logger.error("LLM generation error", exc_info=exc, extra={"connection_id": payload.connection_id})
        raise HTTPException(status_code=503, detail={"error": "LLMGenerationError", "detail": str(exc)}) from exc
    except UnsafeSQLError as exc:
        logger.warning("Unsafe SQL rejected", exc_info=exc, extra={"connection_id": payload.connection_id})
        raise HTTPException(status_code=400, detail={"error": "DML/DDL not allowed", "detail": str(exc)}) from exc
    except DatabaseExecutionError as exc:
        logger.error("Database execution error", exc_info=exc, extra={"connection_id": payload.connection_id})
        raise HTTPException(status_code=400, detail={"error": "Query failed against database", "detail": str(exc)}) from exc
    except Exception as exc:
        logger.error("Unexpected query failure", exc_info=exc, extra={"connection_id": payload.connection_id})
        raise HTTPException(status_code=500, detail={"error": "InternalServerError", "detail": "Query execution failed"}) from exc

    response = {
        "type": "sql_result",
        "sql": sql,
        "columns": columns,
        "rows": serialized_rows,
        "truncated": truncated,
    }
    if truncated:
        response["total_rows_available"] = total_rows_available
    return response
