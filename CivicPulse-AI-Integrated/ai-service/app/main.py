from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router
from app.core.config import APP_NAME, APP_VERSION

app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description="AI-assisted civic complaint classification, priority recommendation and duplicate matching."
)

# Restrict allowed origins to trusted frontend/backend origins in production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(router, prefix="/api/v1")

@app.get("/")
def root():
    return {"service": APP_NAME, "version": APP_VERSION, "docs": "/docs"}

@app.get("/health")
def health():
    return {"status": "ok", "service": "civicconnect-ai"}
