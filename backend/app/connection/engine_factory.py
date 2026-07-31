from __future__ import annotations

from sqlalchemy import create_engine, text
from sqlalchemy.exc import DatabaseError, OperationalError

from app.db.connector import build_connection_string_from_params
from app.core.exceptions import DatabaseExecutionError, InvalidCredentialsError


def build_engine_from_params(db_type: str, **params):
    conn_str = build_connection_string_from_params(db_type=db_type, **params)
    connect_args = {}
    if db_type in ("postgresql", "mysql"):
        connect_args["connect_timeout"] = 10
    elif db_type == "sqlite":
        connect_args["timeout"] = 10
    return create_engine(conn_str, pool_pre_ping=True, connect_args=connect_args)


def test_connection(engine) -> None:
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            result.scalar()
    except (OperationalError, DatabaseError) as exc:
        raise InvalidCredentialsError(f"Connection test failed: {exc}") from exc
    except Exception as exc:  # pragma: no cover - defensive
        raise InvalidCredentialsError(f"Connection test failed: {exc}") from exc


def execute_query(connection, sql: str):
    try:
        with connection.connect() as conn:
            result = conn.execute(text(sql))
            return result
    except (OperationalError, DatabaseError) as exc:
        raise DatabaseExecutionError(str(exc)) from exc
    except Exception as exc:
        raise DatabaseExecutionError(str(exc)) from exc
