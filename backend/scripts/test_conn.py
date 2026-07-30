import sys
from pathlib import Path

from sqlalchemy import create_engine, text

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

# ---- CONFIG: edit these ----
DB_TYPE = "postgresql"     # postgresql | mysql | sqlite
DB_USER = "postgres"
DB_PASSWORD = "postgres"
DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = "postgres"
SQLITE_PATH = "./data/mydb.db"   # only used if DB_TYPE == "sqlite"
# -----------------------------


def build_connection_string() -> str:
    if DB_TYPE == "sqlite":
        return f"sqlite:///{SQLITE_PATH}"
    if DB_TYPE == "postgresql":
        return f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    if DB_TYPE == "mysql":
        return f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    raise ValueError(f"Unsupported DB_TYPE: {DB_TYPE}")


def main():
    conn_str = build_connection_string()
    print(f"Connecting with: {DB_TYPE} dialect")

    engine = create_engine(conn_str, pool_pre_ping=True)

    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("SELECT 1 ->", result.scalar())

            table_name = input("Enter a table name to test SELECT against (or press Enter to skip): ").strip()
            if table_name:
                rows = conn.execute(text(f"SELECT * FROM {table_name} LIMIT 5")).fetchall()
                print(f"\nFirst {len(rows)} rows from '{table_name}':")
                for row in rows:
                    print(row)

        print("\n✅ Connection successful.")

    except Exception as e:
        print("\n❌ Connection failed.")
        print("Error:", e)


if __name__ == "__main__":
    main()