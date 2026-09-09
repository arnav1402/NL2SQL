from __future__ import annotations

import os
from pathlib import Path
import re

import duckdb
from dotenv import load_dotenv

from app.core.exceptions import UnsupportedDialectError

BASE_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BASE_DIR / ".env")


def get_env(name: str, default: str | None = None) -> str | None:
    value = os.getenv(name, default)
    return value if value not in (None, "") else default


def get_sqlglot_dialect(db_type: str) -> str:
    mapping = {
        "postgresql": "postgres",
        "postgres": "postgres",
        "mysql": "mysql",
        "sqlite": "sqlite",
        "duckdb": "duckdb",
    }
    normalized = db_type.lower()
    if normalized not in mapping:
        raise UnsupportedDialectError(
            f"'{db_type}' is not a supported database type. Supported types: {', '.join(sorted(set(mapping.keys())))}."
        )
    return mapping[normalized]


def build_connection_string() -> str:
    db_type = get_env("DB_TYPE", "postgresql")
    db_user = get_env("DB_USER", "postgres")
    db_password = get_env("DB_PASSWORD", "postgres")
    db_host = get_env("DB_HOST", "localhost")
    db_port = get_env("DB_PORT", "5432")
    db_name = get_env("DB_NAME", "postgres")
    sqlite_path = get_env("SQLITE_PATH", str(BASE_DIR / "data" / "mydb.db"))
    duckdb_path = get_env("DUCKDB_PATH", str(BASE_DIR / "data" / "mydb.duckdb"))

    if db_type == "sqlite":
        return f"sqlite:///{sqlite_path}"
    if db_type == "postgresql":
        return f"postgresql+psycopg2://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
    if db_type == "mysql":
        return f"mysql+pymysql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
    if db_type == "duckdb":
        return f"duckdb:///{duckdb_path}"
    raise UnsupportedDialectError(f"'{db_type}' is not a supported database type.")


def build_connection_string_from_params(
    db_type: str,
    host: str | None = None,
    port: str | int | None = None,
    username: str | None = None,
    password: str | None = None,
    database: str | None = None,
    schema: str | None = None,
    sqlite_path: str | None = None,
    duckdb_path: str | None = None,
) -> str:
    if db_type == "sqlite":
        path = sqlite_path or str(BASE_DIR / "data" / "mydb.db")
        return f"sqlite:///{path}"

    if db_type == "postgresql":
        host = host or "localhost"
        port = port or "5432"
        username = username or "postgres"
        password = password or "postgres"
        database = database or "postgres"
        schema = schema or "public"
        conn_str = f"postgresql+psycopg2://{username}:{password}@{host}:{port}/{database}"
        if schema:
            return f"{conn_str}?options=-csearch_path%3D{schema}"
        return conn_str

    if db_type == "mysql":
        host = host or "localhost"
        port = port or "3306"
        username = username or "root"
        password = password or ""
        database = database or "mysql"
        return f"mysql+pymysql://{username}:{password}@{host}:{port}/{database}"

    if db_type == "duckdb":
        path = duckdb_path or str(BASE_DIR / "data" / "mydb.duckdb")
        return f"duckdb:///{path}"

    raise UnsupportedDialectError(f"'{db_type}' is not a supported database type.")


def ingest_csv(
    csv_path: str,
    duckdb_path: str,
    table_name: str = "data",
    replace: bool = False,
) -> None:
    if not re.fullmatch(r"[A-Za-z0-9_]+", table_name):
        raise ValueError("table_name must contain only alphanumeric characters and underscores")

    escaped_csv_path = csv_path.replace("'", "''")
    try:
        with duckdb.connect(duckdb_path) as connection:
            if replace:
                connection.execute(f"DROP TABLE IF EXISTS {table_name}")
            connection.execute(
                f"CREATE TABLE {table_name} AS "
                f"SELECT * FROM read_csv_auto('{escaped_csv_path}', sample_size=-1)"
            )
    except Exception as exc:
        raise RuntimeError(
            f"Could not ingest CSV '{csv_path}' into table '{table_name}' in '{duckdb_path}': {exc}"
        ) from exc

def control():
    pass