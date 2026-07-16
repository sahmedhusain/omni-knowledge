export interface Document {
  id: number;
  filename: string;
  size_bytes: number;
  tag: string | null;
  status: 'indexing' | 'indexed' | 'failed' | 'skipped';
  created_at: string;
  updated_at: string;
}

export interface Source {
  filename: string;
  tag: string | null;
  content: string;
  score: number;
}

export interface SearchResponse {
  query: string;
  answer: string;
  sources: Source[];
  latency_ms: number;
  cache_hit: boolean;
}

export interface CountsMetrics {
  docs: number;
  chunks: number;
  queries: number;
}

export interface LatencyMetrics {
  median_ms: number;
  p95_ms: number;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  hit_rate: number;
}

export interface FailuresMetrics {
  total: number;
  by_type: Record<string, number>;
}

export interface IndexingMetrics {
  total_runs: number;
  avg_duration_ms: number;
}

export interface SystemMetrics {
  counts: CountsMetrics;
  latency: LatencyMetrics;
  query_cache: CacheMetrics;
  embedding_cache: CacheMetrics;
  failures: FailuresMetrics;
  indexing: IndexingMetrics;
}
