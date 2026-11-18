# CivicPulse + CivicConnect Python ML integration

The existing Gemini AI endpoints and UI remain in place. The Python service is an additional independent classifier/priority recommender and TF-IDF duplicate matcher.

## 1. Python service (Windows PowerShell)

```powershell
cd ai-service
py -3 -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python training/train_model.py
uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
```

Check `http://127.0.0.1:8001/health` and `http://127.0.0.1:8001/api/v1/model-info`. Keep this terminal running. The model artifact is generated locally and is intentionally not bundled.

## 2. Node backend

In another terminal:

```powershell
cd backend
# add this to backend/.env (do not commit .env):
# ML_AI_SERVICE_URL=http://127.0.0.1:8001
npm install
npm run dev
```

The authenticated Node API proxies ML requests. Python service is not called directly by the browser. New routes: `GET /api/v1/ai/ml/model-info`, `POST /api/v1/ai/ml/predict`, `POST /api/v1/ai/ml/duplicates`. Existing `/ai/analyze`, `/ai/check-duplicates`, and `/ai/recommend-teams` remain unchanged.

## 3. Frontend

```powershell
cd frontend
npm install
npm run dev
```

On Citizen > Report Incident, use **Run ML Category & Priority Prediction**. It runs alongside the existing Gemini analysis. The ML category labels (`Public Safety`, `Street Lighting`, `Sanitation`, `Roads`, `Water Supply`, `Electricity`) do not match the current incident enum (`fire`, `accident`, `medical`, `crime`, `other`), so ML output is displayed as advisory only and is not auto-saved.

## Notes

- Start Python service before calling the ML buttons.
- Training data is synthetic/curated demonstration data; test metrics are not a production guarantee.
- Priority rules are advisory. Staff must verify urgent and critical reports.
- For production, use private service networking, service authentication, monitoring, rate limits and representative privacy-scrubbed evaluation data.
