from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BASE_DIR / ".env")


def get_env(name: str, default: str | None = None) -> str | None:
    value = os.getenv(name, default)
    return value if value not in (None, "") else default


DB_TYPE = get_env("DB_TYPE", "postgresql")
DB_USER = get_env("DB_USER", "postgres")
DB_PASSWORD = get_env("DB_PASSWORD", "postgres")
DB_HOST = get_env("DB_HOST", "localhost")
DB_PORT = get_env("DB_PORT", "5432")
DB_NAME = get_env("DB_NAME", "postgres")
SQLITE_PATH = get_env("SQLITE_PATH", str(BASE_DIR / "data" / "mydb.db"))
CONNECTION_TIMEOUT_MINUTES = int(get_env("CONNECTION_TIMEOUT_MINUTES", "30"))
MIN_RETRIEVAL_SCORE = float(get_env("MIN_RETRIEVAL_SCORE", "0.3"))

PINECONE_API_KEY = get_env("PINECONE_API_KEY")
PINECONE_INDEX_NAME = get_env("PINECONE_INDEX_NAME") or get_env("PINECONE_INDEX")
PINECONE_ENVIRONMENT = get_env("PINECONE_ENVIRONMENT")

GROQ_API_KEY = get_env("GROQ_API_KEY")
GROQ_MODEL = get_env("GROQ_MODEL", "llama-3.3-70b-versatile")
MAX_RESULT_ROWS = int(get_env("MAX_RESULT_ROWS"))
