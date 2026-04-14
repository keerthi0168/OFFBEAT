# ML Features and Pipeline Notes

This project uses both Node-side recommendation utilities and a Python ML service.

## 1) Python training pipeline (`tourism_ml_pipeline.py`)

### Input support

- Main dataset can be CSV or JSON via `--data`.
- Extra JSON files are appended during training:
  - `dataset/hidden_places_states.json`
  - `dataset/hidden_places_territories.json`

### Core flow

1. Load and validate required columns.
2. Prepare features (`state`, `category`, `best_season`, `budget`, `rating`).
3. Prepare target from `popularity_score` (bins when continuous).
4. Build preprocessing pipeline:
   - numeric: median imputation + `StandardScaler`
   - categorical: frequent imputation + `OneHotEncoder`
5. Train `RandomForestClassifier`.
6. Evaluate with accuracy/precision/recall/F1 + classification report.
7. Save trained pipeline with `joblib`.

### Example command

```bash
python tourism_ml_pipeline.py --data dataset/india_tourism_dataset.json --model-out tourism_rf_pipeline.joblib
```

## 2) Runtime recommendation and planner behavior

Frontend (`client/src/utils/mlApi.js`) is ML-first but resilient:

- calls ML endpoints for ranking/planner/chatbot
- if ML fails or is slow, falls back to deterministic local/Node logic

Notable fallback behavior:

- Itinerary generation uses weighted scoring + continuity penalties.
- Chatbot calls fallback endpoint when ML confidence is low/unavailable.

## 3) Training quality best practices

- Validate JSON schemas before training.
- Keep the training dataset parsable and consistent (no trailing text).
- Re-run training whenever major dataset edits are merged.
- Version model outputs with date + dataset hash when possible.

## 4) Operational recommendations

- Host ML service independently from Node API for cleaner scaling.
- Set `VITE_ML_API_URL` explicitly in all deployed environments.
- Track fallback rate; rising fallback usage often means ML service health issues.
