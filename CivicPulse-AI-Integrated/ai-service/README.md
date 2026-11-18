# CivicConnect AI — Advanced Complaint Intelligence Service

A standalone FastAPI microservice for CivicConnect. It provides complaint category classification, priority recommendation, duplicate similarity checks, model metadata, and health checks.

## Features
- English + Romanized Hindi/Hinglish complaint text support (starter coverage)
- Word + character TF-IDF feature union
- Logistic Regression with validation-only selection of `C`
- Fixed train/validation/test split grouped by original complaint seed
- Category prediction with class probabilities
- Rule-based safety priority suggestion (advisory only)
- TF-IDF cosine-similarity duplicate candidate search
- Input validation, API docs, tests, training report and model artifact folder

## Quick start (macOS/Linux)
```bash
cd CIVICCONNECT-AI-Advanced
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python training/train_model.py
uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
```
Docs: http://127.0.0.1:8001/docs
Health: http://127.0.0.1:8001/health

## Test
In another terminal, activate the same environment:
```bash
source venv/bin/activate
pip install -r requirements-dev.txt
pytest -q
```

## Endpoints
- `GET /health`
- `GET /api/v1/model-info`
- `POST /api/v1/predict`
- `POST /api/v1/duplicates`

Example prediction:
```bash
curl -X POST http://127.0.0.1:8001/api/v1/predict \
  -H 'Content-Type: application/json' \
  -d '{"text":"Raat ko gali mein street light band hai"}'
```

## Dataset and evaluation limitations
`training/complaints.csv` contains 3,000 synthetic/curated rows (500 per category), with English and Romanized Hindi/Hinglish examples. The dataset is built from 600 issue/context seed groups, with five wording variants per group. All variants of a group remain in one split (70% train, 15% validation, 15% test by seed group), preventing direct paraphrase leakage. This is still generated demonstration data: patterns may be easier than real citizen reports, and the test score is not a production guarantee. Do not claim 97% accuracy unless it is actually achieved on a representative, independently collected, untouched test set.

The Hindi/Hinglish samples are written in Roman script. Add Devanagari samples if citizens will submit Devanagari text.

## Production checklist
- Put this service behind private backend-to-service networking and authenticate requests.
- Keep citizen names, phone numbers, exact addresses and uploaded evidence out of model text unless strictly necessary.
- Use human review for category and priority, especially `Critical` cases.
- Monitor confidence, drift, false negatives, latency and service errors.
- Add rate limits, audit logs, retention controls and model/version tracking.
