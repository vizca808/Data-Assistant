import json
from pathlib import Path
from typing import Any
import numpy as np
import google.generativeai as genai
from core.config import settings


class VectorStore:
    """Numpy-based in-memory vector store with JSON persistence."""

    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.store_dir = Path(settings.CHROMA_DIR)
        self.store_dir.mkdir(parents=True, exist_ok=True)

    def _get_file_path(self, session_id: str) -> Path:
        return self.store_dir / f"session_{session_id.replace('-', '_')}.json"

    def _load_collection(self, session_id: str) -> dict:
        file_path = self._get_file_path(session_id)
        if file_path.exists():
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        return {"documents": [], "embeddings": [], "metadatas": []}

    def _save_collection(self, session_id: str, data: dict):
        file_path = self._get_file_path(session_id)
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f)

    def index_chunks(self, session_id: str, chunks: list[dict[str, Any]]) -> None:
        """Embed and store text chunks for a session."""
        if not chunks:
            return

        texts = [c["text"] for c in chunks]
        metadatas = [c.get("metadata", {}) for c in chunks]

        # Embed with Gemini
        embeddings = []
        batch_size = 50
        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            result = genai.embed_content(
                model=settings.GEMINI_EMBEDDING_MODEL,
                content=batch,
                task_type="retrieval_document",
            )
            embeddings.extend(result["embedding"])

        data = {
            "documents": texts,
            "embeddings": embeddings,
            "metadatas": metadatas,
        }
        self._save_collection(session_id, data)

    def search(self, session_id: str, query: str, top_k: int = 5) -> list[str]:
        """Search for relevant chunks given a query."""
        try:
            data = self._load_collection(session_id)
            if not data["documents"]:
                return []

            query_embedding = genai.embed_content(
                model=settings.GEMINI_EMBEDDING_MODEL,
                content=query,
                task_type="retrieval_query",
            )["embedding"]

            # Compute cosine similarity
            q_vec = np.array(query_embedding)
            doc_vecs = np.array(data["embeddings"])
            
            # Normalize vectors for cosine similarity
            q_norm = np.linalg.norm(q_vec)
            doc_norms = np.linalg.norm(doc_vecs, axis=1)
            
            # Avoid division by zero
            q_norm = q_norm if q_norm > 0 else 1e-10
            doc_norms = np.where(doc_norms > 0, doc_norms, 1e-10)
            
            similarities = np.dot(doc_vecs, q_vec) / (doc_norms * q_norm)
            
            # Get top_k indices
            top_indices = np.argsort(similarities)[::-1][:top_k]
            
            return [data["documents"][i] for i in top_indices]
        except Exception as e:
            print(f"Vector search error: {e}")
            return []

    def delete_collection(self, session_id: str) -> None:
        """Delete all vectors for a session."""
        try:
            file_path = self._get_file_path(session_id)
            if file_path.exists():
                file_path.unlink()
        except Exception:
            pass
