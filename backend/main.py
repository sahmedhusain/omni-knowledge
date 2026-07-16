import sys
from pathlib import Path
# Add project root to python path to support relative backend imports
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.api.router import api_router
from backend.app.services.vector_store import VectorStore

app = FastAPI(
    title="Guidely API",
    description="Knowledge Assistant RAG system API",
    version="1.0.0"
)

# Set up CORS middleware for React/Vite development server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    # Load existing FAISS vectors and mappings
    VectorStore.load()
    
    # Pre-seed sample docs if database is completely empty
    import sqlite3
    from backend.app.config import settings
    from backend.app.api.documents import trigger_reindexing
    
    try:
        conn = sqlite3.connect(str(settings.DB_PATH))
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM documents")
        count = cursor.fetchone()[0]
        conn.close()
        if count == 0:
            print("Database is empty. Pre-seeding sample documents...")
            await trigger_reindexing()
            print("Pre-seeding completed successfully!")
    except Exception as e:
        print("Pre-seeding skipped:", str(e))

# Include consolidated api router
app.include_router(api_router)

@app.get("/health")
async def health_root():
    """Alias for /api/metrics/health"""
    from backend.app.api.metrics import health_check
    return await health_check()

@app.get("/metrics")
async def metrics_root():
    """Alias for /api/metrics"""
    from backend.app.api.metrics import get_system_metrics
    return await get_system_metrics()

@app.get("/")
async def root():
    return {
        "message": "Welcome to Guidely internal knowledge assistant API",
        "endpoints": {
            "docs": "/docs",
            "health": "/health",
            "metrics": "/metrics"
        }
    }

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
