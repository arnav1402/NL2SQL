from __future__ import annotations

"""
Only DQL (SELECT) is permitted. All DDL (CREATE, ALTER, DROP, TRUNCATE) and
DML (INSERT, UPDATE, DELETE, MERGE) must be rejected here before reaching the
database. This is defense-in-depth: the DB connection should already use a
read-only role so writes would fail at the database level regardless, but this
validator exists as an additional layer so unsafe SQL is rejected with a clear
reason before ever touching the database, rather than relying on DB permissions
alone.
"""

from typing import Any

import sqlglot
from sqlglot import exp
from sqlglot.errors import ParseError
from sqlalchemy import text
from sqlalchemy.engine import Engine

from app.core.exceptions import UnsafeSQLError
from app.utils.logger import logger

UNSAFE_KEYWORDS = [
    "insert",
    "update",
    "delete",
    "drop",
    "alter",
    "truncate",
    "grant",
    "revoke",
    "create",
    "merge",
]

UNSAFE_NODE_TYPES = {
    "Insert",
    "Update",
    "Delete",
    "Create",
    "Alter",
    "Drop",
    "Truncate",
    "Grant",
    "Revoke",
    "Merge",
}


def _mask_sql(sql: str) -> str:
    return sql.replace("\n", " ")


def _walk_ast(expression: exp.Expression) -> list[str]:
    node_types: list[str] = []
    for node in expression.walk():
        node_types.append(type(node).__name__)
    return node_types


def validate_sql(sql: str, engine: Engine, dialect: str) -> tuple[bool, str]:
    comment = (
        "Only DQL (SELECT) is permitted. All DDL and DML are rejected before execution "
        "as defense-in-depth, so unsafe SQL is rejected with a clear reason before ever touching the database."
    )
    try:
        statements = sqlglot.parse(sql, read=dialect)
    except ParseError as exc:
        return False, f"The generated SQL could not be parsed: {exc}"
    except Exception as exc:
        return False, f"The generated SQL could not be parsed: {exc}"

    if not statements:
        return False, "No SQL statement was generated"

    if len(statements) > 1:
        return False, f"Only a single SQL statement is allowed per request. Detected {len(statements)} statements — this may indicate an injection attempt or a malformed generation."

    expression = statements[0]
    root_name = type(expression).__name__.lower()
    if root_name != "select":
        return False, f"Only read-only SELECT queries are allowed. This request would require a {root_name} operation, which is not permitted."

    node_names = _walk_ast(expression)
    unsafe_node = next((node_name for node_name in node_names if node_name in UNSAFE_NODE_TYPES), None)
    if unsafe_node:
        return False, f"Only read-only SELECT queries are allowed. This request would require a {unsafe_node} operation, which is not permitted."

    if any(isinstance(node, exp.Select) and node.args.get("into") for node in expression.walk()):
        return False, "Only read-only SELECT queries are allowed. SELECT INTO is not permitted."

    lowered = sql.lower()
    for keyword in UNSAFE_KEYWORDS:
        if keyword in lowered:
            return False, f"Only read-only SELECT queries are allowed. This request would require a {keyword.upper()} operation, which is not permitted."

    try:
        with engine.connect() as connection:
            explain_sql = f"EXPLAIN {sql}"
            connection.execute(text(explain_sql))
    except Exception as exc:
        logger.warning("SQL explain validation failed", exc_info=exc)
        return False, f"This query references something that doesn't exist in the database: {exc}"

    return True, ""
