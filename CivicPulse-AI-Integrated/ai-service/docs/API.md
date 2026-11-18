# API reference

Base URL: `http://127.0.0.1:8001`

## GET /health
Returns service health.

## GET /api/v1/model-info
Returns whether a model is loaded, its path, version and category list.

## POST /api/v1/predict
Request:
```json
{"text":"Raat ko gali mein street light band hai","location_hint":"Sector 12"}
```
Returns category, confidence, per-class probabilities, priority suggestion, model version and advisory text.

## POST /api/v1/duplicates
Request:
```json
{
  "text":"Garbage has not been collected from our lane",
  "existing_complaints":[
    {"complaint_id":"CMP-101","text":"Our lane garbage collection is pending"}
  ]
}
```
Returns candidate matches above the configured cosine-similarity threshold.
