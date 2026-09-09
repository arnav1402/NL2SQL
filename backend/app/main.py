from __future__ import annotations

from __future__ import annotations

import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.connection import router as connection_router
from app.api.routes.csv_upload import router as csv_upload_router
from app.api.routes.health import router as health_router
from app.api.routes.query import router as query_router
from app.api.routes.schema import router as schema_router
from app.connection import connection_manager
from app.connection.cleanup import cleanup_expired_connections
from app.config import CONNECTION_TIMEOUT_MINUTES
from app.utils.logger import logger

app = FastAPI(title="NL2SQL Backend")

# This should be restricted in production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(connection_router)
app.include_router(csv_upload_router)
app.include_router(query_router)
app.include_router(schema_router)
app.include_router(health_router)


async def _connection_cleanup_loop() -> None:
    interval_seconds = 5 * 60
    while True:
        try:
            expired = cleanup_expired_connections(timeout_minutes=CONNECTION_TIMEOUT_MINUTES)
            for connection_id in expired:
                logger.info("Connection expired and removed", extra={"connection_id": connection_id})
        except Exception as exc:
            logger.error("Connection cleanup loop failed", exc_info=exc)
        await asyncio.sleep(interval_seconds)


@app.on_event("startup")
async def on_startup() -> None:
    logger.info("Starting NL2SQL backend")
    asyncio.create_task(_connection_cleanup_loop())
