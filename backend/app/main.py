from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import APP_NAME
from app.database import Base, engine
from app.routers import workflows
from app.routers import executions
import app.models

Base.metadata.create_all(bind=engine)

app = FastAPI(title=APP_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(workflows.router)
app.include_router(executions.router)

@app.get("/")
def root():
    return {"message": f"Welcome to {APP_NAME}"}

@app.get("/health")
def health():
    return {"status": "ok"}