from pydantic import BaseModel
from typing import Optional

class DocumentResponse(BaseModel):
    id: int
    filename: str
    size_bytes: int
    tag: Optional[str] = None
    status: str
    created_at: str
    updated_at: str

class DocumentUpdateTag(BaseModel):
    tag: str
