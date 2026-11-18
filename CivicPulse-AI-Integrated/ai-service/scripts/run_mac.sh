#!/bin/bash
set -e
cd "$(dirname "$0")/.."
if [ ! -d venv ]; then python3 -m venv venv; fi
source venv/bin/activate
pip install -r requirements.txt
if [ ! -f artifacts/category_model.joblib ]; then python training/train_model.py; fi
uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
