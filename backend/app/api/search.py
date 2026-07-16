import time
import hashlib
from fastapi import APIRouter, HTTPException
from backend.app.config import settings
from backend.app.database import get_db
from backend.app.models.search import SearchRequest, SearchResponse, SourceResponse
from backend.app.services.embedder import Embedder
from backend.app.services.vector_store import VectorStore
from backend.app.services.llm import LLMService
from backend.app.services.metrics_tracker import MetricsTracker

router = APIRouter(prefix="/search", tags=["search"])

@router.post("/ask", response_model=SearchResponse)
async def ask_question(request: SearchRequest):
    start_time = time.time()
    query = request.query.strip()
    top_k = request.top_k or settings.TOP_K
    
    if not query:
        MetricsTracker.log_query("", None, 0, False, settings.LLM_PROVIDER, "Empty query")
        raise HTTPException(status_code=400, detail="Query cannot be empty")
        
    query_hash = hashlib.md5(query.encode("utf-8")).hexdigest()
    
    # Check embedding cache hit status before calling Embedder
    with get_db() as db:
        cursor = db.cursor()
        cursor.execute("SELECT 1 FROM embedding_cache WHERE checksum = ?", (query_hash,))
        cache_hit = cursor.fetchone() is not None

    try:
        # Get query embedding (uses DB cache internally)
        query_embedding = Embedder.embed_text(query, is_query=True)
        
        # Retrieve top-k nearest chunk IDs from FAISS vector store
        nearest = VectorStore.search(query_embedding, k=top_k)
        
        if not nearest:
            latency_ms = int((time.time() - start_time) * 1000)
            answer = "I could not find any documents related to your question. Please make sure documents are indexed."
            MetricsTracker.log_query(query, answer, latency_ms, cache_hit, settings.LLM_PROVIDER)
            return SearchResponse(
                query=query,
                answer=answer,
                sources=[],
                latency_ms=latency_ms,
                cache_hit=cache_hit
            )
            
        chunk_ids = [n[0] for n in nearest]
        scores_map = {n[0]: n[1] for n in nearest}
        
        # Retrieve chunk contents and source file tags/metadata from SQLite
        with get_db() as db:
            cursor = db.cursor()
            placeholders = ",".join("?" for _ in chunk_ids)
            cursor.execute(
                f"""
                SELECT c.id, c.content, d.filename, d.tag 
                FROM chunks c
                JOIN documents d ON c.document_id = d.id
                WHERE c.id IN ({placeholders})
                """,
                chunk_ids
            )
            rows = cursor.fetchall()
            
        # Map back to preserve similarity order
        chunks = []
        sources = []
        for row in rows:
            chunk_data = {
                "id": row["id"],
                "content": row["content"],
                "filename": row["filename"],
                "tag": row["tag"],
                "score": scores_map[row["id"]]
            }
            chunks.append(chunk_data)
            sources.append(
                SourceResponse(
                    filename=row["filename"],
                    tag=row["tag"],
                    content=row["content"],
                    score=scores_map[row["id"]]
                )
            )
            
        # Re-sort sources based on FAISS distance (ascending order of L2 distance)
        sources.sort(key=lambda s: s.score)
        chunks.sort(key=lambda c: c["score"])
        
        # Generate LLM answer
        answer = LLMService.generate_answer(query, chunks, history=request.history)
        
        latency_ms = int((time.time() - start_time) * 1000)
        
        # Log successful query execution
        MetricsTracker.log_query(
            query=query,
            answer=answer,
            latency_ms=latency_ms,
            cache_hit=cache_hit,
            provider=settings.LLM_PROVIDER,
            sources=[{"filename": s.filename, "content": s.content} for s in sources]
        )
        
        return SearchResponse(
            query=query,
            answer=answer,
            sources=sources,
            latency_ms=latency_ms,
            cache_hit=cache_hit
        )
        
    except ValueError as ve:
        # Handles missing key configuration errors
        latency_ms = int((time.time() - start_time) * 1000)
        error_msg = str(ve)
        MetricsTracker.log_query(query, None, latency_ms, cache_hit, settings.LLM_PROVIDER, error_msg)
        raise HTTPException(status_code=400, detail=error_msg)
    except Exception as e:
        latency_ms = int((time.time() - start_time) * 1000)
        error_msg = str(e)
        MetricsTracker.log_query(query, None, latency_ms, cache_hit, settings.LLM_PROVIDER, error_msg)
        raise HTTPException(status_code=500, detail=f"Search pipeline failure: {error_msg}")
