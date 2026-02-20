from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class PostCreate(BaseModel):
    title: str = "Untitled"


class PostUpdate(BaseModel):
    """Used by PATCH — everything optional so auto-save can send
    just the fields that changed."""
    title: Optional[str] = None
    lexical_state: Optional[dict] = None
    plain_text: Optional[str] = None


class PostResponse(BaseModel):
    """Full post — returned on create, get single, and update."""
    id: str = Field(alias="_id")
    title: str
    lexical_state: Optional[dict] = None
    plain_text: str = ""
    status: str = "draft"
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True


class PostListItem(BaseModel):
    """Lightweight — for the sidebar list. We skip lexical_state
    because it can be large and the list doesn't need it."""
    id: str = Field(alias="_id")
    title: str
    status: str
    updated_at: datetime

    class Config:
        populate_by_name = True
