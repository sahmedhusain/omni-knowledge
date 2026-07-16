from pydantic import BaseModel, Field
from typing import List, Optional

class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Question query text")
    top_k: Optional[int] = Field(default=3, ge=1, le=10, description="Number of source chunks to retrieve")

class SourceResponse(BaseModel):
    filename: str
    tag: Optional[str] = None
    content: str
    score: float

class SearchResponse(BaseModel):
    query: str
    answer: str
    sources: List[SourceResponse]
    latency_ms: int
    cache_hit: bool
