from __future__ import annotations

from pydantic import BaseModel, ConfigDict, model_validator


class ConnectionRequestBase(BaseModel):
    model_config = ConfigDict(extra="forbid")
    db_type: str


class PostgreSQLConnectionRequest(ConnectionRequestBase):
    host: str = "localhost"
    port: int = 5432
    username: str = "postgres"
    password: str = "postgres"
    database: str = "postgres"
    schema: str = "public"


class MySQLConnectionRequest(ConnectionRequestBase):
    host: str = "localhost"
    port: int = 3306
    username: str = "root"
    password: str = ""
    database: str = "mysql"


class SQLiteConnectionRequest(ConnectionRequestBase):
    sqlite_path: str = "./data/mydb.db"

    @model_validator(mode="after")
    def validate_sqlite(self) -> "SQLiteConnectionRequest":
        if not self.sqlite_path:
            raise ValueError("sqlite_path is required for sqlite connections")
        return self


class ConnectionResponse(BaseModel):
    connection_id: str
    status: str
    tables_indexed: int


class ConnectionMetadataResponse(BaseModel):
    connection_id: str
    db_type: str
    dialect: str
    namespace: str
    database_name: str
    created_at: str
    last_used_at: str
    schema_version: int
