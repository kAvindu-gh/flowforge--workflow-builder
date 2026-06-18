from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ExecutionResponse(BaseModel):
    id: int
    workflow_id: int
    status: str
    result: Optional[str]
    error: Optional[str]
    started_at: datetime
    finished_at: Optional[datetime]

    class Config:
        from_attributes = True