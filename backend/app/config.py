from dotenv import load_dotenv
import os

load_dotenv()

APP_NAME = os.getenv("APP_NAME", "FlowForge")
DEBUG = os.getenv("DEBUG", "True") == "True"
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./flowforge.db")