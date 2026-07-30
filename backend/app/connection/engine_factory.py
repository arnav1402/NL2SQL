from __future__ import annotations

from sqlalchemy import create_engine, text

from app.db.connector import build_connection_string_from_params
from app.core.exceptions import InvalidCredentialsError


def build_engine_from_params(db_type: str, **params):
    conn_str = build_connection_string_from_params(db_type=db_type, **params)
    return create_engine(conn_str, pool_pre_ping=True)


def test_connection(engine) -> None:
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            result.scalar()
    except Exception as exc:  # pragma: no cover - defensive
        raise InvalidCredentialsError(f"Connection test failed: {exc}") from exc
