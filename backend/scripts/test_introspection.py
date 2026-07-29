from __future__ import annotations

from sqlalchemy import create_engine

from app.config import DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT, DB_TYPE, DB_USER, SQLITE_PATH
from app.db.connector import build_connection_string
from app.db.inspector import get_table_cards
from app.vectordb.pinecone import retrieve, upsert_schema_cards


def main() -> None:
    print(f"Using {DB_TYPE} database connection")
    engine = create_engine(build_connection_string(), pool_pre_ping=True)
    table_cards = get_table_cards(engine, sample_rows=2)

    namespace = "test-session"
    upsert_schema_cards(table_cards, namespace=namespace)

    query = "show me customer orders"
    results = retrieve(query=query, top_k=5, filter_type="schema", namespace=namespace)

    print(f"\nRetrieved {len(results)} matches for query: {query}")
    for item in results:
        metadata = item.get("metadata", {})
        print(f"- table={metadata.get('table')} score={item.get('score')}")
        print(metadata.get("text", "")[:500])
        print("-" * 60)


if __name__ == "__main__":
    main()
