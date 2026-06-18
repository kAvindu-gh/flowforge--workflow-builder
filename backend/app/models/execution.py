from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from app.database import Base


class Execution(Base):
    __tablename__ = "executions"

    id          = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id"), nullable=False)
    status      = Column(String(20), default="pending")  # pending, running, success, failed
    result      = Column(Text, nullable=True)             # JSON string of execution results
    error       = Column(Text, nullable=True)             # error message if failed
    started_at  = Column(DateTime, default=datetime.utcnow)
    finished_at = Column(DateTime, nullable=True)