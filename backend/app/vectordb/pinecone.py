from __future__ import annotations

import httpx
from sentence_transformers import SentenceTransformer
from pinecone import Pinecone, ServerlessSpec
from pinecone.core.client.exceptions import NotFoundException

from app.config import get_env
from app.core.exceptions import VectorStoreError
from app.utils.logger import logger

DIMENSION = 768
BATCH_SIZE = 128
MODEL_NAME = "all-mpnet-base-v2"
HTTP_TIMEOUT_SECONDS = 30.0
MAX_SCHEMA_CARD_RESULTS = 500


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
        self.http_client = httpx.Client(timeout=httpx.Timeout(HTTP_TIMEOUT_SECONDS))
        self.client = Pinecone(api_key=api_key, http_client=self.http_client)
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

        try:
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
        except Exception as exc:
            logger.error("Pinecone upsert_schema_cards failed", exc_info=exc, extra={"namespace": namespace})
            raise VectorStoreError(f"Failed to upsert schema cards: {exc}") from exc

    def query(self, query_text: str, namespace: str, top_k: int = 5) -> list[dict]:
        try:
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
        except Exception as exc:
            logger.error("Pinecone retrieval failed", exc_info=exc, extra={"namespace": namespace})
            raise VectorStoreError(f"Failed to retrieve schema cards: {exc}") from exc

    def delete_namespace(self, namespace: str) -> None:
        try:
            self.index.delete(delete_all=True, namespace=namespace)
        except NotFoundException:
            logger.warning("Pinecone namespace not found during delete", extra={"namespace": namespace})
        except Exception as exc:
            logger.error("Pinecone delete_namespace failed", exc_info=exc, extra={"namespace": namespace})
            raise VectorStoreError(f"Failed to delete namespace {namespace}: {exc}") from exc


def build_namespace(key: str | None = None) -> str:
    if key:
        return f"ns-{key.strip().lower().replace(' ', '-') }"
    return "default"


def upsert_schema_cards(cards: list[dict], namespace: str) -> None:
    service = PineconeService()
    service.upsert_schema_cards(cards, namespace=namespace)


def retrieve(query: str, top_k: int, filter_type: str, namespace: str) -> list[dict]:
    service = PineconeService()
    try:
        response = service.index.query(
            vector=EmbeddingService().embed_text(query),
            top_k=top_k,
            namespace=namespace,
            filter={"type": filter_type},
            include_metadata=True,
        )

        matches: list[dict] = []
        for item in getattr(response, "matches", []) or []:
            metadata = getattr(item, "metadata", None) or {}
            matches.append({"score": getattr(item, "score", None), "metadata": metadata})
        return matches
    except Exception as exc:
        logger.error("Pinecone retrieve helper failed", exc_info=exc, extra={"namespace": namespace})
        raise VectorStoreError(f"Failed to retrieve schema cards: {exc}") from exc


def get_all_schema_cards(namespace: str) -> list[dict]:
    service = PineconeService()
    try:
        zero_vector = [0.0] * DIMENSION
        response = service.index.query(
            vector=zero_vector,
            top_k=MAX_SCHEMA_CARD_RESULTS,
            namespace=namespace,
            filter={"type": "schema"},
            include_metadata=True,
        )

        cards: list[dict] = []
        for item in getattr(response, "matches", []) or []:
            metadata = getattr(item, "metadata", None) or {}
            cards.append({"score": getattr(item, "score", None), "metadata": metadata})
        return cards
    except Exception as exc:
        logger.error("Pinecone get_all_schema_cards failed", exc_info=exc, extra={"namespace": namespace})
        raise VectorStoreError(f"Failed to fetch all schema cards: {exc}") from exc


def delete_namespace(namespace: str) -> None:
    service = PineconeService()
    service.delete_namespace(namespace)
