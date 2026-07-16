from pydantic import BaseModel
from typing import Dict

class CountsMetrics(BaseModel):
    docs: int
    chunks: int
    queries: int

class LatencyMetrics(BaseModel):
    median_ms: float
    p95_ms: float

class CacheMetrics(BaseModel):
    hits: int
    misses: int
    hit_rate: float

class FailuresMetrics(BaseModel):
    total: int
    by_type: Dict[str, int]

class IndexingMetrics(BaseModel):
    total_runs: int
    avg_duration_ms: float

class SystemMetricsResponse(BaseModel):
    counts: CountsMetrics
    latency: LatencyMetrics
    query_cache: CacheMetrics
    embedding_cache: CacheMetrics
    failures: FailuresMetrics
    indexing: IndexingMetrics
