from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class WorkflowCreate(BaseModel):
    name: str
    description: Optional[str] = None
    nodes: list = []
    edges: list = []


class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    nodes: Optional[list] = None
    edges: Optional[list] = None


class WorkflowResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    nodes: list
    edges: list
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True