# NL2SQL : Natural Language to SQL with RAG

A system that lets you connect to a database (Postgres, MySQL, or SQLite) and ask questions in plain English instead of writing SQL by hand.

# Basically what's going on

1. **Connect** — provide DB credentials via API (no hardcoding), and the system introspects your schema automatically.

2. **Index** — table structures, columns, and relationships get embedded and stored in Pinecone, scoped to your connection so different databases never mix.

3. **Ask** — a natural language question retrieves the relevant schema context, builds a grounded prompt, and an LLM (Groq) generates the SQL.

4. **Validate** — every query is checked before execution: SELECT-only enforcement, dialect-aware parsing, and a dry-run EXPLAIN against the real database to catch bad references before anything runs.

5. **Answer** — results come back as structured data, or, for schema questions like "summarize the database," a direct plain-English answer with no SQL involved at all.

# Tech Stack

- **Backend:** FastAPI
- **DB abstraction:** SQLAlchemy (Postgres / MySQL / SQLite)
- **Embeddings:** sentence-transformers (`all-mpnet-base-v2`, local, free)
- **Vector store:** Pinecone (namespace-isolated per connection)
- **LLM:** Groq
- **SQL validation:** sqlglot + EXPLAIN dry-runs

# Setup

## 1. Clone the repository

```bash
git clone https://github.com/arnav1402/NL2SQL.git
cd NL2SQL
```

## 2. Create the Python virtual environment

The project uses the Python version specified in `backend/.python-version`.

### Windows

```powershell
cd backend
py -3.12 -m venv .venv
.venv\Scripts\activate
```

### Linux / macOS

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
```

> Replace `3.12` with the Python version specified in `backend/.python-version` if different.

## 3. Install the backend requirements

Make sure the virtual environment is activated, then run:

```bash
pip install -r requirements.txt
```

## 4. Configure environment variables

Create your `.env` file from `.env.example`:

### Windows

```powershell
copy .env.example .env
```

### Linux / macOS

```bash
cp .env.example .env
```

Open `.env` and add the required API keys and database configuration.

## 5. Start the backend

From the `backend` directory, with the virtual environment activated:

```bash
uvicorn app.main:app --reload
```

The FastAPI backend should now be running.

## 6. Start the frontend

Open a **new terminal** and navigate to the frontend directory:

```bash
cd frontend
npm i
npm run dev
```

The frontend development server will start and provide a local URL in the terminal.

OR

## Run with Docker Compose (IN WORKING)

```bash
docker compose up --build
```

then open

Frontend: http://localhost:5173
Backend: http://localhost:8000/docs

# Status

A frontend, deployment setup, and further hardening are still to come.
**Check back in a few months for a more complete version.**
