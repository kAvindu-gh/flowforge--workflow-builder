from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import APP_NAME
from app.database import Base, engine

# Create all DB tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(title=APP_NAME)

# Allow React frontend to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite's default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": f"Welcome to {APP_NAME}"}

@app.get("/health")
def health():
    return {"status": "ok"}