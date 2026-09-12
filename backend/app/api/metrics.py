from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from backend.app.models.metrics import SystemMetricsResponse
from backend.app.services.metrics_tracker import MetricsTracker
from backend.app.database import get_db
import csv
import io
import json

router = APIRouter(prefix="/metrics", tags=["metrics"])

@router.get("", response_model=SystemMetricsResponse)
async def get_system_metrics():
    """Retrieve aggregate performance and cache statistics."""
    try:
        stats = MetricsTracker.get_metrics()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compile metrics: {str(e)}")

@router.get("/health")
async def health_check():
    """System health check including database availability."""
    db_ok = False
    try:
        with get_db() as db:
            cursor = db.cursor()
            cursor.execute("SELECT 1")
            db_ok = cursor.fetchone() is not None
    except Exception:
        pass
        
    if not db_ok:
        raise HTTPException(status_code=503, detail="Database connection failed")
        
    return {"status": "healthy", "database": "connected"}

@router.get("/export/csv")
async def export_query_logs():
    """Export all query execution logs as a downloadable CSV."""
    try:
        output = io.StringIO()
        writer = csv.writer(output)
        
        # CSV Headers
        writer.writerow(["Timestamp", "Query", "Answer", "Latency (ms)", "Cache Hit", "Provider", "Error", "Retrieved Sources"])
        
        with get_db() as db:
            cursor = db.cursor()
            cursor.execute("SELECT timestamp, query, answer, latency_ms, cache_hit, provider, error, sources FROM query_logs ORDER BY id DESC")
            rows = cursor.fetchall()
            
        for row in rows:
            # Format sources list as simple readable string list
            sources_raw = row["sources"]
            sources_formatted = ""
            if sources_raw:
                try:
                    sources_list = json.loads(sources_raw)
                    sources_formatted = "; ".join([s.get("filename", "unknown") for s in sources_list])
                except Exception:
                    sources_formatted = sources_raw
                    
            writer.writerow([
                row["timestamp"],
                row["query"],
                row["answer"] or "",
                row["latency_ms"],
                "Yes" if row["cache_hit"] else "No",
                row["provider"],
                row["error"] or "",
                sources_formatted
            ])
            
        output.seek(0)
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode("utf-8")),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=omniknowledge_query_logs.csv"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export CSV: {str(e)}")

