"""
Tourism Recommendation ML Pipeline

Implements the full workflow:
1) Load dataset from CSV
2) Data preprocessing
3) Missing value handling
4) Categorical encoding (state, category, best_season)
5) Feature scaling
6) Train/test split (80/20)
7) RandomForest training
8) Evaluation (accuracy, precision, recall, F1)
9) Save trained model with joblib

Usage:
    python tourism_ml_pipeline.py --data "tourism_dataset.csv" --model-out "tourism_rf_pipeline.joblib"
"""

from __future__ import annotations

import argparse

import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


REQUIRED_COLUMNS = [
    "place_name",
    "state",
    "category",
    "budget",
    "rating",
    "best_season",
    "popularity_score",
]



def load_csv_dataset(csv_path: str) -> pd.DataFrame:
    df = pd.read_csv(csv_path)
    missing_cols = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing_cols:
        raise ValueError(f"Dataset is missing required columns: {missing_cols}")
    return df

# New: Load JSON dataset (list of dicts)
def load_json_dataset(json_path: str, mapping: dict = None) -> pd.DataFrame:
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    # Optionally map/rename fields to match REQUIRED_COLUMNS
    if mapping:
        data = [
            {mapping.get(k, k): v for k, v in item.items()}
            for item in data
        ]
    df = pd.DataFrame(data)
    # Only keep required columns if present
    keep_cols = [c for c in REQUIRED_COLUMNS if c in df.columns]
    return df[keep_cols]


def prepare_target(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    """
    Prepare X (features) and y (target).

    Target: popularity_score
    - If popularity_score is numeric with many unique values, bin into 3 classes
      (low/medium/high) for classification metrics.
    - Otherwise use it directly as a categorical target.
    """
    X = df[["state", "category", "best_season", "budget", "rating"]].copy()
    y_raw = df["popularity_score"].copy()

    # If popularity_score looks continuous, convert to class labels via quantile bins
    if pd.api.types.is_numeric_dtype(y_raw) and y_raw.nunique(dropna=True) > 10:
        # Fill temporary NaNs for binning (median), then bin into 3 classes
        y_tmp = y_raw.fillna(y_raw.median())
        y = pd.qcut(y_tmp, q=3, labels=["low", "medium", "high"], duplicates="drop")
        y = y.astype(str)
    else:
        y = y_raw.astype(str)

    return X, y


def build_pipeline(X: pd.DataFrame) -> Pipeline:
    # Dynamically infer numeric/categorical columns
    numeric_features = X.select_dtypes(include=[np.number]).columns.tolist()
    categorical_features = [c for c in X.columns if c not in numeric_features]

    # Ensure requested categorical features are encoded even if type inference differs
    forced_cats = ["state", "category", "best_season"]
    for col in forced_cats:
        if col in X.columns and col not in categorical_features:
            categorical_features.append(col)
            if col in numeric_features:
                numeric_features.remove(col)

    numeric_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )

    categorical_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("encoder", OneHotEncoder(handle_unknown="ignore")),
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, numeric_features),
            ("cat", categorical_transformer, categorical_features),
        ]
    )

    model = RandomForestClassifier(
        n_estimators=300,
        random_state=42,
        class_weight="balanced",
        n_jobs=-1,
    )

    pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("model", model),
        ]
    )
    return pipeline



def train_evaluate_save(data_path: str, model_out: str, extra_jsons: list = None) -> None:
    # 1) Load main data (CSV or JSON)
    if data_path.endswith('.csv'):
        df = load_csv_dataset(data_path)
    elif data_path.endswith('.json'):
        df = load_json_dataset(data_path)
    else:
        raise ValueError("Unsupported file type for main dataset")

    # 2) Optionally load and append extra JSON datasets
    if extra_jsons:
        for json_path in extra_jsons:
            # Try to map fields if needed (user can edit mapping below)
            mapping = {
                'name': 'place_name',
                'category': 'category',
                'state': 'state',
                'best_season': 'best_season',
                'rating': 'rating',
                'popularity_score': 'popularity_score',
                'budget_range': 'budget',
            }
            df_extra = load_json_dataset(json_path, mapping)
            df = pd.concat([df, df_extra], ignore_index=True)

    # 2/3/4/5) Preprocessing, missing values, encoding, scaling (inside pipeline)
    X, y = prepare_target(df)

    # 6) Split 80/20
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y if y.nunique() > 1 else None,
    )

    # 7) Train RandomForest
    pipeline = build_pipeline(X)
    pipeline.fit(X_train, y_train)

    # 8) Evaluate
    y_pred = pipeline.predict(X_test)

    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, average="weighted", zero_division=0)
    recall = recall_score(y_test, y_pred, average="weighted", zero_division=0)
    f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)

    print("\n=== Model Evaluation ===")
    print(f"Accuracy : {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall   : {recall:.4f}")
    print(f"F1-score : {f1:.4f}")
    print("\nClassification Report:\n")
    print(classification_report(y_test, y_pred, zero_division=0))

    # 9) Save model
    output_path = Path(model_out)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, output_path)
    print(f"\nSaved trained pipeline to: {output_path.resolve()}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train tourism recommendation RandomForest pipeline")
    parser.add_argument(
        "--data",
        type=str,
        required=True,
        help="Path to input CSV dataset",
    )
    parser.add_argument(
        "--model-out",
        type=str,
        default="tourism_rf_pipeline.joblib",
        help="Output path for saved joblib model",
    )
    return parser.parse_args()



if __name__ == "__main__":
    args = parse_args()
    # Example: add hidden places datasets here
    extra_jsons = [
        "dataset/hidden_places_states.json",
        "dataset/hidden_places_territories.json",
    ]
    train_evaluate_save(args.data, args.model_out, extra_jsons=extra_jsons)
