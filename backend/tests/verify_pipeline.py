import os
import sys
import time
import shutil
import unittest
from pathlib import Path
from unittest.mock import patch, MagicMock

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.app.config import settings, BASE_DIR

# Override DB path for testing to avoid polluting main db
TEST_DB_DIR = BASE_DIR / "data" / "test_db"
settings.DB_PATH = TEST_DB_DIR / "guidely_test.db"
settings.UPLOAD_DIR = TEST_DB_DIR / "uploads"
settings.VECTOR_STORE_DIR = TEST_DB_DIR / "vector_store"

# Re-ensure test dirs
TEST_DB_DIR.mkdir(parents=True, exist_ok=True)
settings.ensure_dirs()

from backend.app.database import init_db, get_db
from backend.app.services.document_parser import DocumentParser
from backend.app.services.chunker import Chunker
from backend.app.services.embedder import Embedder
from backend.app.services.vector_store import VectorStore
from backend.app.services.llm import LLMService
from backend.app.services.metrics_tracker import MetricsTracker

# Mock embedding vectors generator (dimension 128)
def mock_embedding(text, is_query=False):
    # Deterministic mock embedding based on hash
    import hashlib
    h = hashlib.md5(text.encode('utf-8')).hexdigest()
    vec = [float(int(h[i:i+2], 16)) / 255.0 for i in range(0, 32, 2)]
    # Pad to 128 dimensions
    return vec + [0.0] * (128 - len(vec))

class TestGuidelyRAGPipeline(unittest.TestCase):
    
    @classmethod
    def setUpClass(cls):
        # Initialize test database tables
        init_db()
        
    @classmethod
    def tearDownClass(cls):
        # Clean up test directories
        if TEST_DB_DIR.exists():
            shutil.rmtree(TEST_DB_DIR)

    @patch('backend.app.services.embedder.Embedder._generate_api_embedding', side_effect=mock_embedding)
    @patch('backend.app.services.llm.LLMService.generate_answer', return_value="Mocked response citing expense rules [1].")
    def test_full_pipeline(self, mock_llm, mock_emb):
        print("\n--- Starting Guidely Pipeline Verification Tests ---")
        
        # 1. Test Document Parser
        sample_policy = BASE_DIR / "data" / "sample-docs" / "policy.txt"
        self.assertTrue(sample_policy.exists(), "Sample policy.txt must exist")
        
        text = DocumentParser.parse(sample_policy)
        self.assertIn("Expense Policy", text)
        print("✔ Document parser verified.")
        
        # 2. Test Chunker
        chunks = Chunker.chunk_text(text, chunk_size=100, overlap=10)
        self.assertTrue(len(chunks) > 0)
        print(f"✔ Chunker verified. Generated {len(chunks)} chunks.")
        
        # 3. Test Embedding Caching & Vector Store
        # Clear vector store and DB for clean run
        with get_db() as db:
            cursor = db.cursor()
            cursor.execute("DELETE FROM documents")
            cursor.execute("DELETE FROM chunks")
            cursor.execute("DELETE FROM embedding_cache")
            cursor.execute("DELETE FROM query_logs")
            cursor.execute("DELETE FROM indexing_logs")
            db.commit()
            
        # Index document manually
        with get_db() as db:
            cursor = db.cursor()
            cursor.execute(
                "INSERT INTO documents (filename, checksum, size_bytes, tag, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                ("policy.txt", "mock_checksum", 100, "policy", "indexed", "now", "now")
            )
            doc_id = cursor.lastrowid
            
            for i, chunk in enumerate(chunks):
                chunk_hash = Embedder.get_checksum(chunk)
                cursor.execute(
                    "INSERT INTO chunks (document_id, chunk_index, content, checksum) VALUES (?, ?, ?, ?)",
                    (doc_id, i, chunk, chunk_hash)
                )
            db.commit()
            
        # Trigger vector store rebuild
        VectorStore.rebuild()
        self.assertEqual(VectorStore.get_stats()["total_vectors"], len(chunks))
        print("✔ Vector store indexing verified.")
        
        # 4. Search and retrieval tests (Retrieval@3 check)
        query = "What is the policy limit for meals?"
        query_emb = Embedder.embed_text(query, is_query=True)
        results = VectorStore.search(query_emb, k=3)
        
        self.assertTrue(len(results) > 0)
        print(f"✔ Similarity search verified. Retrieved top {len(results)} chunks.")
        
        # Test Query Caching (Repeated runs skip embedding generation)
        initial_hits = Embedder.cache_hits
        # Second call to embed_text should HIT the SQLite database cache
        _ = Embedder.embed_text(query, is_query=True)
        self.assertEqual(Embedder.cache_hits, initial_hits + 1)
        print("✔ Embedding cache hit effectiveness verified (100% hits for identical query).")
        
        # 5. LLM citation assembly and metrics logging
        start_time = time.time()
        
        # Map matches to actual text
        retrieved_chunks = []
        with get_db() as db:
            cursor = db.cursor()
            for chunk_id, score in results:
                cursor.execute("SELECT content, document_id FROM chunks WHERE id = ?", (chunk_id,))
                row = cursor.fetchone()
                retrieved_chunks.append({"content": row[0], "filename": "policy.txt"})
                
        answer = LLMService.generate_answer(query, retrieved_chunks)
        self.assertIn("Mocked response", answer)
        
        latency_ms = int((time.time() - start_time) * 1000)
        MetricsTracker.log_query(query, answer, latency_ms, True, settings.LLM_PROVIDER)
        
        # Verify stats compile
        metrics = MetricsTracker.get_metrics()
        self.assertEqual(metrics["counts"]["queries"], 1)
        self.assertEqual(metrics["counts"]["docs"], 1)
        self.assertGreaterEqual(metrics["latency"]["median_ms"], 0.0)
        print("✔ Metrics tracking and performance logging verified.")
        print("--- All local pipeline checks PASSED successfully ---\n")

if __name__ == "__main__":
    unittest.main()
