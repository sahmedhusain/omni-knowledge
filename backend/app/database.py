import sqlite3
import json
from datetime import datetime
from contextlib import contextmanager
from backend.app.config import settings

def init_db():
    """Initializes the SQLite database with required tables."""
    conn = sqlite3.connect(str(settings.DB_PATH))
    cursor = conn.cursor()
    
    # Enable WAL mode for better concurrency
    cursor.execute("PRAGMA journal_mode=WAL;")
    
    # Documents table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT UNIQUE NOT NULL,
            checksum TEXT NOT NULL,
            size_bytes INTEGER NOT NULL,
            tag TEXT,
            status TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)
    
    # Document chunks table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS chunks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            document_id INTEGER NOT NULL,
            chunk_index INTEGER NOT NULL,
            content TEXT NOT NULL,
            checksum TEXT NOT NULL,
            FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE
        )
    """)
    
    # Cache table for text-to-embedding mapping
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS embedding_cache (
            checksum TEXT PRIMARY KEY,
            embedding TEXT NOT NULL
        )
    """)
    
    # Performance metrics and logs table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS query_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            query TEXT NOT NULL,
            answer TEXT,
            latency_ms INTEGER NOT NULL,
            cache_hit INTEGER NOT NULL,
            provider TEXT NOT NULL,
            error TEXT,
            sources TEXT
        )
    """)
    
    conn.commit()
    conn.close()

@contextmanager
def get_db():
    """Context manager for database connections."""
    conn = sqlite3.connect(str(settings.DB_PATH))
    conn.row_factory = sqlite3.Row
    # Enable foreign keys
    conn.execute("PRAGMA foreign_keys = ON;")
    try:
        yield conn
    finally:
        conn.close()

# Initialize on import
init_db()
