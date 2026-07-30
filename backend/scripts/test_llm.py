from __future__ import annotations

import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from sqlalchemy import create_engine

from app.db.connector import build_connection_string
from app.llm.groq_client import generate_sql
from app.llm.prompt_builder import build_prompt
from app.vectordb.pinecone import retrieve


def main() -> None:
    engine = create_engine(build_connection_string(), pool_pre_ping=True)
    engine.dispose()

    namespace = "test-session"
    question = "Show me the top 5 customers by total order value"
    results = retrieve(query=question, top_k=5, filter_type="schema", namespace=namespace)

    print(f"Using namespace: {namespace}")
    print(f"Retrieved {len(results)} schema cards")

    if not results:
        print("Warning: no schema cards were retrieved. Run scripts/test_introspection.py first to populate the 'test-session' namespace.")
        return

    table_names = [item.get("metadata", {}).get("table") for item in results if item.get("metadata", {}).get("table")]
    print("Tables:")
    for table_name in table_names:
        print(f"- {table_name}")

    prompt = build_prompt(question, [item.get("metadata", {}) for item in results], dialect="postgresql")
    print("\nPROMPT:\n")
    print(prompt)

    sql = generate_sql(prompt)
    print("\nGENERATED SQL:\n")
    print(sql)


if __name__ == "__main__":
    main()
