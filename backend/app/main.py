from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.connection import router as connection_router
from app.api.routes.health import router as health_router
from app.api.routes.query import router as query_router
from app.api.routes.schema import router as schema_router

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
app.include_router(query_router)
app.include_router(schema_router)
app.include_router(health_router)
