import time
import hashlib
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from typing import List, Optional
from datetime import datetime
from backend.app.config import settings
from backend.app.database import get_db
from backend.app.models.document import DocumentResponse
from backend.app.services.document_parser import DocumentParser
from backend.app.services.chunker import Chunker
from backend.app.services.vector_store import VectorStore
from backend.app.services.metrics_tracker import MetricsTracker

router = APIRouter(prefix="/documents", tags=["documents"])

def get_file_hash(content: bytes) -> str:
    return hashlib.md5(content).hexdigest()

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    tag: Optional[str] = Form(None)
):
    start_time = time.time()
    filename = file.filename
    content = await file.read()
    
    # Save original file
    settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    file_path = settings.UPLOAD_DIR / filename
    with open(file_path, "wb") as f:
        f.write(content)
        
    checksum = get_file_hash(content)
    size_bytes = len(content)
    
    # Check if document already exists and has not changed
    with get_db() as db:
        cursor = db.cursor()
        cursor.execute("SELECT id, checksum FROM documents WHERE filename = ?", (filename,))
        existing = cursor.fetchone()
        
        if existing:
            if existing["checksum"] == checksum:
                # File is unchanged
                cursor.execute(
                    "SELECT id, filename, size_bytes, tag, status, created_at, updated_at FROM documents WHERE id = ?",
                    (existing["id"],)
                )
                row = cursor.fetchone()
                duration_ms = int((time.time() - start_time) * 1000)
                MetricsTracker.log_indexing(filename, duration_ms, 0, "skipped")
                return DocumentResponse(**dict(row))
            else:
                # File updated - delete old chunks, update metadata
                doc_id = existing["id"]
                cursor.execute("DELETE FROM chunks WHERE document_id = ?", (doc_id,))
                cursor.execute(
                    """
                    UPDATE documents 
                    SET checksum = ?, size_bytes = ?, tag = ?, status = 'indexing', updated_at = ? 
                    WHERE id = ?
                    """,
                    (checksum, size_bytes, tag or "general", datetime.now().isoformat(), doc_id)
                )
            db.commit()
        else:
            # Create new doc metadata
            cursor.execute(
                """
                INSERT INTO documents (filename, checksum, size_bytes, tag, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (filename, checksum, size_bytes, tag or "general", "indexing", datetime.now().isoformat(), datetime.now().isoformat())
            )
            db.commit()
            doc_id = cursor.lastrowid

    # Parse and chunk document
    try:
        raw_text = DocumentParser.parse(file_path)
        chunks = Chunker.chunk_text(raw_text, settings.CHUNK_SIZE, settings.CHUNK_OVERLAP)
        
        # Save chunks in SQLite
        with get_db() as db:
            cursor = db.cursor()
            for idx, chunk_text in enumerate(chunks):
                chunk_hash = hashlib.md5(chunk_text.encode("utf-8")).hexdigest()
                cursor.execute(
                    "INSERT INTO chunks (document_id, chunk_index, content, checksum) VALUES (?, ?, ?, ?)",
                    (doc_id, idx, chunk_text, chunk_hash)
                )
            
            cursor.execute("UPDATE documents SET status = 'indexed' WHERE id = ?", (doc_id,))
            db.commit()
            
        # Rebuild FAISS index
        VectorStore.rebuild()
        
        # Retrieve final document metadata
        with get_db() as db:
            cursor = db.cursor()
            cursor.execute("SELECT * FROM documents WHERE id = ?", (doc_id,))
            doc_row = cursor.fetchone()
            
        duration_ms = int((time.time() - start_time) * 1000)
        MetricsTracker.log_indexing(filename, duration_ms, len(chunks), "success")
        
        return DocumentResponse(**dict(doc_row))
        
    except Exception as e:
        # Mark document as failed
        with get_db() as db:
            cursor = db.cursor()
            cursor.execute("UPDATE documents SET status = 'failed' WHERE id = ?", (doc_id,))
            db.commit()
            
        duration_ms = int((time.time() - start_time) * 1000)
        MetricsTracker.log_indexing(filename, duration_ms, 0, "failed", str(e))
        raise HTTPException(status_code=500, detail=f"Failed to parse and index document: {str(e)}")

@router.get("", response_model=List[DocumentResponse])
async def list_documents():
    with get_db() as db:
        cursor = db.cursor()
        cursor.execute("SELECT * FROM documents ORDER BY created_at DESC")
        rows = cursor.fetchall()
        return [DocumentResponse(**dict(row)) for row in rows]

@router.delete("/{doc_id}")
async def delete_document(doc_id: int):
    with get_db() as db:
        cursor = db.cursor()
        cursor.execute("SELECT filename FROM documents WHERE id = ?", (doc_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Document not found")
            
        filename = row["filename"]
        cursor.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
        db.commit()
        
    # Remove file from disk
    file_path = settings.UPLOAD_DIR / filename
    if file_path.exists():
        try:
            file_path.unlink()
        except Exception:
            pass
            
    # Rebuild FAISS index
    VectorStore.rebuild()
    return {"message": "Document deleted successfully"}

@router.post("/reindex")
async def trigger_reindexing():
    """Trigger a full system re-indexing of all uploaded files."""
    start_time = time.time()
    
    # Auto-seed sample-docs directory if not already present
    import shutil
    import os
    if settings.SAMPLE_DOCS_DIR.exists():
        for filename in os.listdir(settings.SAMPLE_DOCS_DIR):
            if filename.endswith((".txt", ".md", ".json")):
                src_path = settings.SAMPLE_DOCS_DIR / filename
                dest_path = settings.UPLOAD_DIR / filename
                
                # Check if already registered
                with get_db() as db:
                    cursor = db.cursor()
                    cursor.execute("SELECT id FROM documents WHERE filename = ?", (filename,))
                    exists = cursor.fetchone()
                    
                if not exists:
                    try:
                        # Copy file to uploads folder
                        shutil.copy2(src_path, dest_path)
                        
                        # Determine tag based on filename
                        tag = filename.split(".")[0]
                        if tag not in ["faq", "policy", "onboarding", "general", "technical"]:
                            tag = "general"
                            
                        file_size = dest_path.stat().st_size
                        now_str = datetime.now().isoformat()
                        checksum = hashlib.md5(dest_path.read_bytes()).hexdigest()
                        
                        with get_db() as db:
                            cursor = db.cursor()
                            cursor.execute(
                                """
                                INSERT INTO documents (filename, checksum, size_bytes, tag, status, created_at, updated_at)
                                VALUES (?, ?, ?, ?, 'indexed', ?, ?)
                                """,
                                (filename, checksum, file_size, tag, now_str, now_str)
                            )
                            db.commit()
                    except Exception:
                        pass

    with get_db() as db:
        cursor = db.cursor()
        cursor.execute("SELECT id, filename, tag FROM documents")
        docs = cursor.fetchall()
        
    indexed_count = 0
    errors = []
    
    for doc in docs:
        doc_id = doc["id"]
        filename = doc["filename"]
        file_path = settings.UPLOAD_DIR / filename
        
        if not file_path.exists():
            errors.append(f"File not found on disk: {filename}")
            continue
            
        try:
            raw_text = DocumentParser.parse(file_path)
            chunks = Chunker.chunk_text(raw_text, settings.CHUNK_SIZE, settings.CHUNK_OVERLAP)
            
            with get_db() as db:
                cursor = db.cursor()
                # Clear old chunks
                cursor.execute("DELETE FROM chunks WHERE document_id = ?", (doc_id,))
                
                # Insert new ones
                for idx, chunk_text in enumerate(chunks):
                    chunk_hash = hashlib.md5(chunk_text.encode("utf-8")).hexdigest()
                    cursor.execute(
                        "INSERT INTO chunks (document_id, chunk_index, content, checksum) VALUES (?, ?, ?, ?)",
                        (doc_id, idx, chunk_text, chunk_hash)
                    )
                cursor.execute("UPDATE documents SET status = 'indexed', updated_at = ? WHERE id = ?", (datetime.now().isoformat(), doc_id))
                db.commit()
            indexed_count += 1
        except Exception as e:
            errors.append(f"Failed {filename}: {str(e)}")
            
    # Rebuild FAISS index
    VectorStore.rebuild()
    
    duration_ms = int((time.time() - start_time) * 1000)
    if errors:
        MetricsTracker.log_indexing("system_reindex", duration_ms, indexed_count, "partial_success", "; ".join(errors))
        return {"status": "partial_success", "indexed": indexed_count, "errors": errors}
        
    MetricsTracker.log_indexing("system_reindex", duration_ms, indexed_count, "success")
    return {"status": "success", "indexed": indexed_count}
