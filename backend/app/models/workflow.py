import json
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from app.database import Base


class Workflow(Base):
    __tablename__ = "workflows"

    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)
    nodes       = Column(Text, default="[]")   # stored as JSON string
    edges       = Column(Text, default="[]")   # stored as JSON string
    is_active   = Column(Boolean, default=True)
    created_at  = Column(DateTime, default=datetime.utcnow)
    updated_at  = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def get_nodes(self):
        return json.loads(self.nodes)

    def get_edges(self):
        return json.loads(self.edges)

    def set_nodes(self, nodes: list):
        self.nodes = json.dumps(nodes)

    def set_edges(self, edges: list):
        self.edges = json.dumps(edges)