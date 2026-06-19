import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.workflow import Workflow
from app.schemas.workflow import WorkflowCreate, WorkflowUpdate, WorkflowResponse

router = APIRouter(prefix="/workflows", tags=["workflows"])


@router.get("/", response_model=list[WorkflowResponse])
def get_all_workflows(db: Session = Depends(get_db)):
    workflows = db.query(Workflow).filter(Workflow.is_active == True).all()
    for wf in workflows:
        wf.nodes = wf.get_nodes()
        wf.edges = wf.get_edges()
    return workflows


@router.get("/{workflow_id}", response_model=WorkflowResponse)
def get_workflow(workflow_id: int, db: Session = Depends(get_db)):
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    workflow.nodes = workflow.get_nodes()
    workflow.edges = workflow.get_edges()
    return workflow


@router.post("/", response_model=WorkflowResponse, status_code=201)
def create_workflow(data: WorkflowCreate, db: Session = Depends(get_db)):
    workflow = Workflow(
        name=data.name,
        description=data.description,
    )
    workflow.set_nodes(data.nodes)
    workflow.set_edges(data.edges)
    db.add(workflow)
    db.commit()
    db.refresh(workflow)
    workflow.nodes = workflow.get_nodes()
    workflow.edges = workflow.get_edges()
    return workflow


@router.put("/{workflow_id}", response_model=WorkflowResponse)
def update_workflow(workflow_id: int, data: WorkflowUpdate, db: Session = Depends(get_db)):
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    if data.name is not None:
        workflow.name = data.name
    if data.description is not None:
        workflow.description = data.description
    if data.nodes is not None:
        workflow.set_nodes(data.nodes)
    if data.edges is not None:
        workflow.set_edges(data.edges)
    db.commit()
    db.refresh(workflow)
    workflow.nodes = workflow.get_nodes()
    workflow.edges = workflow.get_edges()
    return workflow


@router.delete("/{workflow_id}")
def delete_workflow(workflow_id: int, db: Session = Depends(get_db)):
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    workflow.is_active = False  # soft delete — keeps data in DB
    db.commit()
    return {"message": f"Workflow {workflow_id} deleted"}