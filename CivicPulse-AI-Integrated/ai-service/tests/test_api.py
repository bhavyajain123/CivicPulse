from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_model_info_route():
    response = client.get("/api/v1/model-info")
    assert response.status_code == 200
    assert "model_loaded" in response.json()

def test_predict_validation():
    response = client.post("/api/v1/predict", json={"text": "Street light is not working near the park"})
    assert response.status_code in (200, 503)

def test_duplicate_empty_list():
    response = client.post("/api/v1/duplicates", json={"text": "Garbage is not collected from our street", "existing_complaints": []})
    assert response.status_code == 200
    assert response.json()["matches"] == []
