from fastapi import APIRouter, HTTPException
from backend.app.models.metrics import SystemMetricsResponse
from backend.app.services.metrics_tracker import MetricsTracker
from backend.app.database import get_db

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
