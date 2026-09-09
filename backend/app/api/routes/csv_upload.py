from __future__ import annotations

from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from sqlalchemy import inspect

from app.api.models.connection import ConnectionResponse
from app.config import BASE_DIR, CSV_SAMPLE_ROWS, MAX_CSV_SIZE_MB
from app.connection import connection_manager
from app.db.connector import ingest_csv
from app.utils.logger import logger

router = APIRouter(prefix="/connection", tags=["connection"])

CSV_UPLOAD_DIR = BASE_DIR / "data" / "uploads"
CHUNK_SIZE = 1024 * 1024


@router.post("/csv", response_model=ConnectionResponse)
async def upload_csv(
    file: UploadFile = File(...),
    table_name: str = Form("data"),
) -> ConnectionResponse:
    filename = file.filename or ""
    if not filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are accepted")
    connection_id = str(uuid4())
    CSV_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    csv_path = CSV_UPLOAD_DIR / f"{connection_id}.csv"
    duckdb_path = CSV_UPLOAD_DIR / f"{connection_id}.duckdb"
    max_size = MAX_CSV_SIZE_MB * 1024 * 1024
    total_size = 0

    try:
        with csv_path.open("wb") as destination:
            while chunk := await file.read(CHUNK_SIZE):
                total_size += len(chunk)
                if total_size > max_size:
                    raise HTTPException(
                        status_code=413,
                        detail=f"CSV file exceeds the configured maximum size of {MAX_CSV_SIZE_MB} MB",
                    )
                destination.write(chunk)

        if total_size == 0:
            raise HTTPException(status_code=400, detail="The uploaded CSV file is empty")

        ingest_csv(str(csv_path), str(duckdb_path), table_name=table_name)
        connection_manager.create_connection(
            "duckdb",
            sample_rows=CSV_SAMPLE_ROWS,
            connection_id=connection_id,
            duckdb_path=str(duckdb_path),
            source_csv_path=str(csv_path),
            table_name=table_name,
        )
        metadata = connection_manager.get_connection(connection_id)
        tables_indexed = len(inspect(metadata.engine).get_table_names())
        return ConnectionResponse(
            connection_id=connection_id,
            status="connected",
            tables_indexed=tables_indexed,
        )
    except HTTPException:
        csv_path.unlink(missing_ok=True)
        duckdb_path.unlink(missing_ok=True)
        raise
    except Exception as exc:
        csv_path.unlink(missing_ok=True)
        duckdb_path.unlink(missing_ok=True)
        logger.error("CSV upload failed", exc_info=exc, extra={"connection_id": connection_id})
        raise HTTPException(status_code=400, detail=f"CSV upload failed: {exc}") from exc
