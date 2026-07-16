import json
import os
import faiss
import numpy as np
from pathlib import Path
from typing import List, Dict, Tuple
from backend.app.config import settings
from backend.app.database import get_db

class VectorStore:
    """Service wrapping FAISS vector index and SQLite mappings."""
    
    _index = None
    _chunk_ids: List[int] = []

    @classmethod
    def get_index_path(cls) -> Path:
        return settings.VECTOR_STORE_DIR / "faiss.index"

    @classmethod
    def get_mappings_path(cls) -> Path:
        return settings.VECTOR_STORE_DIR / "mappings.json"

    @classmethod
    def load(cls):
        """Load FAISS index and mappings from disk."""
        index_path = cls.get_index_path()
        mappings_path = cls.get_mappings_path()
        
        if index_path.exists() and mappings_path.exists():
            try:
                cls._index = faiss.read_index(str(index_path))
                with open(mappings_path, "r") as f:
                    cls._chunk_ids = json.load(f)
            except Exception as e:
                # Fallback reset if files are corrupted
                cls._index = None
                cls._chunk_ids = []
        else:
            cls._index = None
            cls._chunk_ids = []

    @classmethod
    def save(cls):
        """Save FAISS index and mappings to disk."""
        if cls._index is not None:
            settings.VECTOR_STORE_DIR.mkdir(parents=True, exist_ok=True)
            faiss.write_index(cls._index, str(cls.get_index_path()))
            with open(cls.get_mappings_path(), "w") as f:
                json.dump(cls._chunk_ids, f)

    @classmethod
    def rebuild(cls):
        """Rebuild index from scratch using all active chunks in database."""
        with get_db() as db:
            cursor = db.cursor()
            # Fetch all chunks and their embedded cache references
            cursor.execute("""
                SELECT c.id, c.content, c.checksum, d.status 
                FROM chunks c
                JOIN documents d ON c.document_id = d.id
                WHERE d.status = 'indexed'
            """)
            rows = cursor.fetchall()
            
        if not rows:
            # Clean up files if no active documents
            cls._index = None
            cls._chunk_ids = []
            if cls.get_index_path().exists():
                os.remove(cls.get_index_path())
            if cls.get_mappings_path().exists():
                os.remove(cls.get_mappings_path())
            return

        from backend.app.services.embedder import Embedder
        
        embeddings = []
        valid_chunk_ids = []
        
        for row in rows:
            try:
                # Uses cached DB embeddings where possible
                emb = Embedder.embed_text(row["content"])
                if emb:
                    embeddings.append(emb)
                    valid_chunk_ids.append(row["id"])
            except Exception:
                # Log or skip errors during batch rebuild
                continue
                
        if not embeddings:
            return
            
        dim = len(embeddings[0])
        cls._index = faiss.IndexFlatL2(dim)
        cls._index.add(np.array(embeddings).astype("float32"))
        cls._chunk_ids = valid_chunk_ids
        cls.save()

    @classmethod
    def search(cls, query_embedding: List[float], k: int = 3) -> List[Tuple[int, float]]:
        """Search top-k nearest chunks, returning list of (chunk_id, score)."""
        if cls._index is None:
            cls.load()
            if cls._index is None:
                return []
                
        if not query_embedding:
            return []
            
        query_np = np.array([query_embedding]).astype("float32")
        # Ensure k is not larger than indexed items
        k_val = min(k, len(cls._chunk_ids))
        if k_val <= 0:
            return []
            
        distances, indices = cls._index.search(query_np, k_val)
        
        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx != -1 and idx < len(cls._chunk_ids):
                chunk_id = cls._chunk_ids[idx]
                results.append((chunk_id, float(dist)))
                
        return results

    @classmethod
    def get_stats(cls) -> dict:
        return {
            "total_vectors": len(cls._chunk_ids) if cls._chunk_ids else 0,
            "index_type": "IndexFlatL2" if cls._index is not None else "None"
        }
