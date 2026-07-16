import os
from pathlib import Path
from dotenv import load_dotenv

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

# Load the env variables from the project root .env file
load_dotenv(dotenv_path=BASE_DIR.parent / ".env")

class Settings:
    # Environment
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "gemini").lower()
    
    # API Keys
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # Storage Paths
    UPLOAD_DIR: Path = DATA_DIR / "uploads"
    SAMPLE_DOCS_DIR: Path = DATA_DIR / "sample-docs"
    VECTOR_STORE_DIR: Path = DATA_DIR / "vector_store"
    DB_DIR: Path = DATA_DIR / "db"
    
    # SQLite DB File Path
    DB_PATH: Path = DB_DIR / "guidely.db"
    
    # RAG Settings
    CHUNK_SIZE: int = int(os.getenv("CHUNK_SIZE", "800"))
    CHUNK_OVERLAP: int = int(os.getenv("CHUNK_OVERLAP", "100"))
    TOP_K: int = int(os.getenv("TOP_K", "3"))
    
    # Models
    OPENAI_EMBEDDING_MODEL: str = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
    GEMINI_EMBEDDING_MODEL: str = os.getenv("GEMINI_EMBEDDING_MODEL", "models/gemini-embedding-001")
    
    OPENAI_LLM_MODEL: str = os.getenv("OPENAI_LLM_MODEL", "gpt-4o-mini")
    GEMINI_LLM_MODEL: str = os.getenv("GEMINI_LLM_MODEL", "gemini-1.5-flash")

    def ensure_dirs(self):
        """Create necessary data directories if they do not exist."""
        self.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        self.SAMPLE_DOCS_DIR.mkdir(parents=True, exist_ok=True)
        self.VECTOR_STORE_DIR.mkdir(parents=True, exist_ok=True)
        self.DB_DIR.mkdir(parents=True, exist_ok=True)

# Instantiate settings
settings = Settings()
settings.ensure_dirs()
