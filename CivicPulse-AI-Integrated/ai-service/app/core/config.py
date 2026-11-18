import os
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parents[2]
load_dotenv(ROOT_DIR / ".env")

APP_NAME = "CivicConnect AI Service"
APP_VERSION = "3.0.0"
HOST = os.getenv("HOST", "127.0.0.1")
PORT = int(os.getenv("PORT", "8001"))
MODEL_PATH = Path(os.getenv("MODEL_PATH", str(ROOT_DIR / "artifacts" / "category_model.joblib")))
DUPLICATE_THRESHOLD = float(os.getenv("DUPLICATE_THRESHOLD", "0.45"))
