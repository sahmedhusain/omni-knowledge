import json
import numpy as np
from datetime import datetime
from typing import List, Dict, Optional
from backend.app.database import get_db
from backend.app.services.embedder import Embedder

class MetricsTracker:
    """Service to track and compute system metrics in SQLite."""
    
    @classmethod
    def log_query(
        cls,
        query: str,
        answer: Optional[str],
        latency_ms: int,
        cache_hit: bool,
        provider: str,
        error: Optional[str] = None,
        sources: Optional[List[Dict]] = None
    ):
        """Log a user query transaction."""
        with get_db() as db:
            cursor = db.cursor()
            sources_json = json.dumps(sources) if sources else None
            cursor.execute(
                """
                INSERT INTO query_logs 
                (timestamp, query, answer, latency_ms, cache_hit, provider, error, sources) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    datetime.now().isoformat(),
                    query,
                    answer,
                    latency_ms,
                    1 if cache_hit else 0,
                    provider,
                    error,
                    sources_json
                )
            )
            db.commit()

    @classmethod
    def log_indexing(
        cls,
        filename: str,
        duration_ms: int,
        chunks_count: int,
        status: str,
        error: Optional[str] = None
    ):
        """Log an indexing task transaction."""
        with get_db() as db:
            cursor = db.cursor()
            cursor.execute(
                """
                INSERT INTO indexing_logs 
                (timestamp, filename, duration_ms, chunks_count, status, error) 
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    datetime.now().isoformat(),
                    filename,
                    duration_ms,
                    chunks_count,
                    status,
                    error
                )
            )
            db.commit()

    @classmethod
    def get_metrics(cls) -> dict:
        """Fetch and compute aggregate performance metrics."""
        metrics = {
            "counts": {"docs": 0, "chunks": 0, "queries": 0},
            "latency": {"median_ms": 0.0, "p95_ms": 0.0},
            "query_cache": {"hits": 0, "misses": 0, "hit_rate": 0.0},
            "embedding_cache": Embedder.get_stats(),
            "failures": {"total": 0, "by_type": {}},
            "indexing": {"total_runs": 0, "avg_duration_ms": 0.0}
        }
        
        with get_db() as db:
            cursor = db.cursor()
            
            # 1. Document & chunk counts
            cursor.execute("SELECT COUNT(*) FROM documents WHERE status = 'indexed'")
            metrics["counts"]["docs"] = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM chunks")
            metrics["counts"]["chunks"] = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM query_logs")
            metrics["counts"]["queries"] = cursor.fetchone()[0]
            
            # 2. Query Latency stats
            cursor.execute("SELECT latency_ms FROM query_logs WHERE error IS NULL")
            latencies = [row[0] for row in cursor.fetchall()]
            if latencies:
                metrics["latency"]["median_ms"] = float(np.median(latencies))
                metrics["latency"]["p95_ms"] = float(np.percentile(latencies, 95))
                
            # 3. Query cache stats
            cursor.execute("SELECT COUNT(*) FROM query_logs WHERE cache_hit = 1")
            hits = cursor.fetchone()[0]
            total_queries = metrics["counts"]["queries"]
            metrics["query_cache"]["hits"] = hits
            metrics["query_cache"]["misses"] = total_queries - hits
            metrics["query_cache"]["hit_rate"] = hits / total_queries if total_queries > 0 else 0.0
            
            # 4. Failure counts and log analysis
            cursor.execute("SELECT error FROM query_logs WHERE error IS NOT NULL")
            errors = [row[0] for row in cursor.fetchall()]
            metrics["failures"]["total"] = len(errors)
            
            error_types = {}
            for err in errors:
                # Group by base exception name or first word
                err_type = err.split(":")[0] if ":" in err else err
                error_types[err_type] = error_types.get(err_type, 0) + 1
            metrics["failures"]["by_type"] = error_types
            
            # 5. Indexing throughput
            cursor.execute("SELECT COUNT(*), AVG(duration_ms) FROM indexing_logs")
            run_count, avg_duration = cursor.fetchone()
            metrics["indexing"]["total_runs"] = run_count or 0
            metrics["indexing"]["avg_duration_ms"] = float(avg_duration or 0.0)
            
        return metrics
