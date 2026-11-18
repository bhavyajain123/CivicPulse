from fastapi import APIRouter, HTTPException
from app.schemas.complaint import (
    PredictRequest, PredictResponse, DuplicateRequest, DuplicateResponse, DuplicateMatch
)
from app.services.classifier import predict_category, model_info
from app.services.priority import recommend_priority
from app.services.duplicates import find_similar
from app.core.config import APP_VERSION, DUPLICATE_THRESHOLD

router = APIRouter()

@router.get("/model-info")
def get_model_info():
    return model_info()

@router.post("/predict", response_model=PredictResponse)
def predict(payload: PredictRequest):
    try:
        result = predict_category(payload.text)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    priority, reason = recommend_priority(payload.text)
    return PredictResponse(
        **result,
        priority=priority,
        priority_reason=reason,
        model_version=APP_VERSION,
        advisory="AI output is advisory. A municipal staff member must verify category and priority."
    )

@router.post("/duplicates", response_model=DuplicateResponse)
def duplicates(payload: DuplicateRequest):
    existing = [
        {"complaint_id": item.complaint_id, "text": item.text}
        for item in payload.existing_complaints
    ]
    matches = find_similar(payload.text, existing)
    return DuplicateResponse(
        matches=[DuplicateMatch(**item) for item in matches],
        threshold=DUPLICATE_THRESHOLD,
        advisory="Similarity is a review signal, not proof that two complaints are duplicates."
    )
