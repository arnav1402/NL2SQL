## NL2SQL : Natural Language to SQL with RAG

A system that lets you connect to a database (Postgres, MySQL, or 
SQLite) and ask questions in plain English instead of writing SQL by hand.

# Basically what's going on

1. **Connect** — provide DB credentials via API (no hardcoding), and the 
   system introspects your schema automatically.
2. **Index** — table structures, columns, and relationships get embedded and 
   stored in Pinecone, scoped to your connection so different databases never 
   mix.
3. **Ask** — a natural language question retrieves the relevant schema 
   context, builds a grounded prompt, and an LLM (Groq) generates 
   the SQL.
4. **Validate** — every query is checked before execution: SELECT-only 
   enforcement, dialect-aware parsing, and a dry-run EXPLAIN against the real 
   database to catch bad references before anything runs.
5. **Answer** — results come back as structured data, or, for schema 
   questions like "summarize the database," a direct plain-English answer 
   with no SQL involved at all.

# Tech Stack

- **Backend:** FastAPI
- **DB abstraction:** SQLAlchemy (Postgres / MySQL / SQLite)
- **Embeddings:** sentence-transformers (`all-mpnet-base-v2`, local, free)
- **Vector store:** Pinecone (namespace-isolated per connection)
- **LLM:** Groq
- **SQL validation:** sqlglot + EXPLAIN dry-runs

# Status

A frontend, deployment setup, and further hardening are still to come.
**Check back in a few months for a more complete version.**
