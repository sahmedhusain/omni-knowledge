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

# Include consolidated api router
app.include_router(api_router)

@app.get("/")
async def root():
    return {
        "message": "Welcome to Guidely internal knowledge assistant API",
        "endpoints": {
            "docs": "/docs",
            "health": "/api/metrics/health"
        }
    }

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
