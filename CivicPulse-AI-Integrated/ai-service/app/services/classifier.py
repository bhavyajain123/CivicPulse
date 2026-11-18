import joblib
from app.core.config import MODEL_PATH, APP_VERSION

_model = None

def load_model():
    global _model
    if _model is None and MODEL_PATH.exists():
        _model = joblib.load(MODEL_PATH)
    return _model

def model_info():
    model = load_model()
    return {
        "model_loaded": model is not None,
        "model_path": str(MODEL_PATH),
        "model_version": APP_VERSION,
        "categories": list(model.classes_) if model is not None else []
    }

def predict_category(text: str) -> dict:
    model = load_model()
    if model is None:
        raise RuntimeError("Model not found. Run: python training/train_model.py")
    probs = model.predict_proba([text])[0]
    labels = model.classes_
    best = int(probs.argmax())
    return {
        "category": str(labels[best]),
        "confidence": round(float(probs[best]), 4),
        "probabilities": {str(label): round(float(prob), 4) for label, prob in zip(labels, probs)}
    }
