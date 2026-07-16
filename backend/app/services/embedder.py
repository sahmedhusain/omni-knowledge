import json
import hashlib
import numpy as np
from typing import List
from backend.app.config import settings
from backend.app.database import get_db

class Embedder:
    """Service to generate and cache text embeddings using OpenAI or Gemini."""
    
    # In-memory session stats
    cache_hits = 0
    cache_misses = 0

    @classmethod
    def get_checksum(cls, text: str) -> str:
        """Compute MD5 checksum of text."""
        return hashlib.md5(text.encode("utf-8")).hexdigest()

    @classmethod
    def embed_text(cls, text: str, is_query: bool = False) -> List[float]:
        """Generate embedding vector for text with database caching."""
        if not text:
            return []
            
        checksum = cls.get_checksum(text)
        
        # 1. Try cache lookup
        cached_embedding = cls._get_cached_embedding(checksum)
        if cached_embedding:
            cls.cache_hits += 1
            return cached_embedding
            
        # 2. Cache miss, call API
        cls.cache_misses += 1
        embedding = cls._generate_api_embedding(text, is_query)
        
        # 3. Store in cache
        cls._cache_embedding(checksum, embedding)
        return embedding

    @classmethod
    def _get_cached_embedding(cls, checksum: str) -> List[float]:
        with get_db() as db:
            cursor = db.cursor()
            cursor.execute("SELECT embedding FROM embedding_cache WHERE checksum = ?", (checksum,))
            row = cursor.fetchone()
            if row:
                return json.loads(row["embedding"])
        return None

    @classmethod
    def _cache_embedding(cls, checksum: str, embedding: List[float]):
        with get_db() as db:
            cursor = db.cursor()
            cursor.execute(
                "INSERT OR REPLACE INTO embedding_cache (checksum, embedding) VALUES (?, ?)",
                (checksum, json.dumps(embedding))
            )
            db.commit()

    @classmethod
    def _generate_api_embedding(cls, text: str, is_query: bool) -> List[float]:
        provider = settings.LLM_PROVIDER
        
        if provider == "openai":
            if not settings.OPENAI_API_KEY:
                raise ValueError("OpenAI API key is missing. Please configure OPENAI_API_KEY in .env.")
            from openai import OpenAI
            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            response = client.embeddings.create(
                input=[text],
                model=settings.OPENAI_EMBEDDING_MODEL
            )
            return response.data[0].embedding
            
        elif provider == "gemini":
            if not settings.GEMINI_API_KEY:
                raise ValueError("Gemini API key is missing. Please configure GEMINI_API_KEY in .env.")
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            task_type = "retrieval_query" if is_query else "retrieval_document"
            response = genai.embed_content(
                model=settings.GEMINI_EMBEDDING_MODEL,
                content=text,
                task_type=task_type
            )
            # Response can be direct dict or object with 'embedding' attribute
            if isinstance(response, dict) and "embedding" in response:
                return response["embedding"]
            elif hasattr(response, "embedding"):
                return response.embedding
            else:
                # Fallback extraction
                return response.get("embedding", [])
                
        elif provider == "ollama":
            from openai import OpenAI
            client = OpenAI(
                base_url=settings.OLLAMA_BASE_URL,
                api_key="ollama"
            )
            response = client.embeddings.create(
                input=[text],
                model=settings.OLLAMA_EMBEDDING_MODEL
            )
            return response.data[0].embedding
            
        else:
            raise ValueError(f"Unsupported LLM_PROVIDER: {provider}")

    @classmethod
    def get_stats(cls) -> dict:
        """Return cache effectiveness statistics."""
        total = cls.cache_hits + cls.cache_misses
        rate = (cls.cache_hits / total) if total > 0 else 0.0
        return {
            "hits": cls.cache_hits,
            "misses": cls.cache_misses,
            "hit_rate": rate
        }
