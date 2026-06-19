import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.workflow import Workflow
from app.models.execution import Execution
from app.schemas.execution import ExecutionResponse
from app.core.executor import run_workflow

router = APIRouter(prefix="/executions", tags=["executions"])


@router.post("/{workflow_id}/run", response_model=ExecutionResponse, status_code=201)
def run_workflow_endpoint(workflow_id: int, db: Session = Depends(get_db)):
    # Check workflow exists
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    # Create execution record
    execution = Execution(
        workflow_id=workflow_id,
        status="running",
        started_at=datetime.utcnow()
    )
    db.add(execution)
    db.commit()
    db.refresh(execution)

    # Run the workflow
    nodes = workflow.get_nodes()
    edges = workflow.get_edges()
    result = run_workflow(nodes, edges)

    # Update execution record with result
    execution.status = result["status"]
    execution.result = json.dumps(result)
    execution.finished_at = datetime.utcnow()

    if result["status"] == "failed":
        execution.error = result.get("error", "Unknown error")

    db.commit()
    db.refresh(execution)
    return execution


@router.get("/{workflow_id}/history", response_model=list[ExecutionResponse])
def get_execution_history(workflow_id: int, db: Session = Depends(get_db)):
    executions = db.query(Execution).filter(
        Execution.workflow_id == workflow_id
    ).order_by(Execution.started_at.desc()).all()
    return executions