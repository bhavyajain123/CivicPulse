from pydantic import BaseModel, Field
from typing import List, Optional

class PredictRequest(BaseModel):
    text: str = Field(min_length=5, max_length=5000, description="Complaint description")
    location_hint: Optional[str] = Field(default=None, max_length=120)

class PredictResponse(BaseModel):
    category: str
    confidence: float
    probabilities: dict[str, float]
    priority: str
    priority_reason: str
    model_version: str
    advisory: str

class ExistingComplaint(BaseModel):
    complaint_id: str = Field(min_length=1, max_length=100)
    text: str = Field(min_length=5, max_length=5000)

class DuplicateRequest(BaseModel):
    text: str = Field(min_length=5, max_length=5000)
    existing_complaints: List[ExistingComplaint] = Field(default_factory=list, max_length=200)

class DuplicateMatch(BaseModel):
    complaint_id: str
    similarity: float

class DuplicateResponse(BaseModel):
    matches: List[DuplicateMatch]
    threshold: float
    advisory: str
