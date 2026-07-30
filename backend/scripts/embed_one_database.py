from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path
from typing import List

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
from sqlalchemy import create_engine, inspect, text
from pinecone import Pinecone, ServerlessSpec

BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

load_dotenv(BASE_DIR / ".env")

DIMENSION = 768
BATCH_SIZE = 128
MODEL_NAME = "all-mpnet-base-v2"


def get_env(name: str, default: str | None = None) -> str | None:
    value = os.getenv(name, default)
    return value if value not in (None, "") else default


def build_connection_string() -> str:
    db_type = get_env("DB_TYPE", "postgresql")
    db_user = get_env("DB_USER", "postgres")
    db_password = get_env("DB_PASSWORD", "postgres")
    db_host = get_env("DB_HOST", "localhost")
    db_port = get_env("DB_PORT", "5432")
    db_name = get_env("DB_NAME", "postgres")
    sqlite_path = get_env("SQLITE_PATH", str(BASE_DIR / "data" / "mydb.db"))

    if db_type == "sqlite":
        return f"sqlite:///{sqlite_path}"
    if db_type == "postgresql":
        return f"postgresql+psycopg2://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
    if db_type == "mysql":
        return f"mysql+pymysql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
    raise ValueError(f"Unsupported DB_TYPE: {db_type}")


def get_table_cards(engine, sample_rows: int = 2) -> list[dict]:
    inspector = inspect(engine)
    table_names = inspector.get_table_names()
    cards: list[dict] = []

    with engine.connect() as connection:
        for table_name in table_names:
            columns = inspector.get_columns(table_name)
            pk_columns = set(inspector.get_pk_constraint(table_name).get("constrained_columns", []))
            foreign_keys = inspector.get_foreign_keys(table_name)

            fk_map: dict[str, str] = {}
            for fk in foreign_keys:
                referred_table = fk.get("referred_table")
                referred_columns = fk.get("referred_columns", [])
                constrained_columns = fk.get("constrained_columns", [])
                if referred_table and referred_columns and constrained_columns:
                    for local_col, ref_col in zip(constrained_columns, referred_columns):
                        fk_map[local_col] = f"{referred_table}.{ref_col}"

            card_lines = [f"Table: {table_name}", "Columns:"]
            for column in columns:
                col_name = column["name"]
                type_str = str(column.get("type"))
                markers: list[str] = []
                if col_name in pk_columns:
                    markers.append("PK")
                if col_name in fk_map:
                    markers.append(f"FK -> {fk_map[col_name]}")
                marker_text = f" ({', '.join(markers)})" if markers else ""
                card_lines.append(f"  - {col_name}: {type_str}{marker_text}")

            sample_lines = ["Sample rows:"]
            try:
                result = connection.execute(text(f"SELECT * FROM {table_name} LIMIT :limit"), {"limit": sample_rows})
                rows = result.fetchall()
                if rows:
                    for row in rows:
                        sample_lines.append(f"  - {tuple(row)}")
                else:
                    sample_lines.append("  - <no rows found>")
            except Exception as exc:  # pragma: no cover - fallback for unsupported dialects
                sample_lines.append(f"  - <sample rows unavailable: {exc}>")

            card_lines.extend(sample_lines)
            cards.append({"table": table_name, "text": "\n".join(card_lines)})

    return cards


class EmbeddingService:
    def __init__(self, model_name: str = MODEL_NAME) -> None:
        self.model = SentenceTransformer(model_name)

    def embed_text(self, text: str) -> list[float]:
        return self.model.encode(text, convert_to_numpy=False).tolist()

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        all_embeddings: list[list[float]] = []
        for start in range(0, len(texts), BATCH_SIZE):
            batch = texts[start : start + BATCH_SIZE]
            batch_embeddings = self.model.encode(batch, convert_to_numpy=False)
            all_embeddings.extend([embedding.tolist() for embedding in batch_embeddings])
        return all_embeddings


class PineconeService:
    def __init__(self) -> None:
        api_key = get_env("PINECONE_API_KEY")
        if not api_key:
            raise ValueError("PINECONE_API_KEY not found in environment")

        self.index_name = get_env("PINECONE_INDEX_NAME") or get_env("PINECONE_INDEX") or "nl2sql"
        self.cloud = get_env("PINECONE_CLOUD", "aws")
        self.region = get_env("PINECONE_ENVIRONMENT") or get_env("PINECONE_REGION") or "us-east-1"
        self.client = Pinecone(api_key=api_key)
        self._ensure_index()
        self.index = self.client.Index(self.index_name)

    def _ensure_index(self) -> None:
        indexes = self.client.list_indexes()
        existing_names = {item.name for item in getattr(indexes, "indexes", [])}
        if self.index_name not in existing_names:
            self.client.create_index(
                name=self.index_name,
                dimension=DIMENSION,
                metric="cosine",
                spec=ServerlessSpec(cloud=self.cloud, region=self.region),
            )

    def upsert_schema_cards(self, cards: list[dict], namespace: str) -> None:
        if not cards:
            return

        texts = [card.get("text", "") for card in cards]
        embeddings = EmbeddingService().embed_batch(texts)
        vectors = []

        for idx, card in enumerate(cards):
            table_name = card.get("table", "")
            vector_id = f"{table_name}-{idx}"
            vectors.append(
                (
                    vector_id,
                    embeddings[idx],
                    {"type": "schema", "table": table_name, "text": card.get("text", "")},
                )
            )

        for start in range(0, len(vectors), BATCH_SIZE):
            batch = vectors[start : start + BATCH_SIZE]
            self.index.upsert(vectors=batch, namespace=namespace)

    def query(self, query_text: str, namespace: str, top_k: int = 5) -> list[dict]:
        query_vector = EmbeddingService().embed_text(query_text)
        response = self.index.query(
            vector=query_vector,
            top_k=top_k,
            namespace=namespace,
            filter={"type": "schema"},
            include_metadata=True,
        )

        matches: list[dict] = []
        for item in getattr(response, "matches", []) or []:
            metadata = getattr(item, "metadata", None) or {}
            matches.append({"score": getattr(item, "score", None), "metadata": metadata})
        return matches


def build_namespace(key: str | None = None) -> str:
    if key:
        return f"ns-{key.strip().lower().replace(' ', '-') }"
    return "default"


def main() -> None:
    parser = argparse.ArgumentParser(description="Embed one database schema into Pinecone")
    parser.add_argument("--key", default=None, help="Key used to generate the Pinecone namespace")
    parser.add_argument("--namespace", default=None, help="Optional explicit namespace override")
    parser.add_argument("--sample-rows", type=int, default=2, help="Number of sample rows to include per table")
    args = parser.parse_args()

    namespace = args.namespace or build_namespace(args.key)

    conn_str = build_connection_string()
    print(f"Connecting with: {get_env('DB_TYPE', 'postgresql')} dialect")
    engine = create_engine(conn_str, pool_pre_ping=True)
    cards = get_table_cards(engine, sample_rows=args.sample_rows)

    pinecone_service = PineconeService()
    pinecone_service.upsert_schema_cards(cards, namespace=namespace)

    query = "show me customer orders"
    results = pinecone_service.query(query, namespace=namespace, top_k=5)

    print(f"\nEmbedded {len(cards)} table cards into index '{pinecone_service.index_name}' in namespace '{namespace}'")
    print(f"Retrieved {len(results)} matches for query: {query}")
    for item in results:
        metadata = item.get("metadata", {})
        table_name = metadata.get("table", "")
        score = item.get("score")
        print(f"- {table_name} (score={score})")


if __name__ == "__main__":
    main()
