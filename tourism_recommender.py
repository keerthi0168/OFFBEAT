"""
Tourism Recommendation Inference Script

Loads a trained pipeline (joblib) and ranks destinations from a dataset
using model confidence + quality signals.

Expected dataset columns:
- place_name, state, category, budget, rating, best_season, popularity_score

Usage example:
    python tourism_recommender.py \
      --model "tourism_rf_pipeline.joblib" \
      --data "mumbai.csv" \
      --state "Maharashtra" \
      --category "Beach" \
      --season "Winter" \
      --budget 3000 \
      --top-k 10
"""

from __future__ import annotations

import argparse
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

REQUIRED_COLUMNS = [
    "place_name",
    "state",
    "category",
    "budget",
    "rating",
    "best_season",
    "popularity_score",
]

FEATURE_COLUMNS = ["state", "category", "best_season", "budget", "rating"]


def load_dataset(csv_path: str) -> pd.DataFrame:
    df = pd.read_csv(csv_path)
    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(f"Dataset is missing required columns: {missing}")
    return df


def normalize_series(series: pd.Series) -> pd.Series:
    """Min-max normalize with safe fallback for constant/invalid data."""
    numeric = pd.to_numeric(series, errors="coerce")
    if numeric.isna().all():
        return pd.Series(np.zeros(len(series)), index=series.index)

    min_v, max_v = numeric.min(), numeric.max()
    if pd.isna(min_v) or pd.isna(max_v) or max_v == min_v:
        return pd.Series(np.ones(len(series)) * 0.5, index=series.index)

    return (numeric - min_v) / (max_v - min_v)


def filter_candidates(
    df: pd.DataFrame,
    state: str | None,
    category: str | None,
    season: str | None,
    max_budget: float | None,
) -> pd.DataFrame:
    filtered = df.copy()

    if state:
        filtered = filtered[
            filtered["state"].astype(str).str.lower() == state.strip().lower()
        ]

    if category:
        filtered = filtered[
            filtered["category"].astype(str).str.lower()
            == category.strip().lower()
        ]

    if season:
        filtered = filtered[
            filtered["best_season"].astype(str).str.lower()
            == season.strip().lower()
        ]

    if max_budget is not None:
        budget_num = pd.to_numeric(filtered["budget"], errors="coerce")
        filtered = filtered[budget_num <= max_budget]

    return filtered


def compute_model_score(model, features: pd.DataFrame) -> np.ndarray:
    """
    Score rows using model confidence.

    If class labels include 'high', use P(class='high').
    Otherwise use max class probability as confidence score.
    """
    proba = model.predict_proba(features)
    classes = [str(c).lower() for c in model.classes_]

    if "high" in classes:
        idx = classes.index("high")
        return proba[:, idx]

    return proba.max(axis=1)


def recommend_places(
    model_path: str,
    data_path: str,
    state: str | None,
    category: str | None,
    season: str | None,
    budget: float | None,
    top_k: int,
) -> pd.DataFrame:
    model = joblib.load(model_path)
    df = load_dataset(data_path)

    candidates = filter_candidates(df, state, category, season, budget)
    if candidates.empty:
        return candidates

    X = candidates[FEATURE_COLUMNS].copy()

    # Model confidence score
    model_score = compute_model_score(model, X)

    # Quality signals
    rating_score = normalize_series(candidates["rating"])
    popularity_score = normalize_series(candidates["popularity_score"])

    # Final ranking score (weighted blend)
    final_score = (
        0.60 * model_score
        + 0.25 * rating_score.to_numpy()
        + 0.15 * popularity_score.to_numpy()
    )

    ranked = candidates.copy()
    ranked["model_score"] = model_score
    ranked["recommendation_score"] = final_score

    ranked = ranked.sort_values("recommendation_score", ascending=False).head(top_k)

    cols = [
        "place_name",
        "state",
        "category",
        "best_season",
        "budget",
        "rating",
        "popularity_score",
        "model_score",
        "recommendation_score",
    ]
    return ranked[cols]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Get top tourism recommendations")
    parser.add_argument("--model", type=str, required=True, help="Path to trained joblib model")
    parser.add_argument("--data", type=str, required=True, help="Path to dataset CSV")
    parser.add_argument("--state", type=str, default=None, help="Filter by state")
    parser.add_argument("--category", type=str, default=None, help="Filter by category")
    parser.add_argument("--season", type=str, default=None, help="Filter by best_season")
    parser.add_argument("--budget", type=float, default=None, help="Max budget filter")
    parser.add_argument("--top-k", type=int, default=10, help="Number of results to return")
    parser.add_argument(
        "--out",
        type=str,
        default=None,
        help="Optional output CSV path for recommendations",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    recommendations = recommend_places(
        model_path=args.model,
        data_path=args.data,
        state=args.state,
        category=args.category,
        season=args.season,
        budget=args.budget,
        top_k=args.top_k,
    )

    if recommendations.empty:
        print("No recommendations found for the given filters.")
        return

    print("\n=== Top Recommendations ===\n")
    print(recommendations.to_string(index=False))

    if args.out:
        out_path = Path(args.out)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        recommendations.to_csv(out_path, index=False)
        print(f"\nSaved recommendations to: {out_path.resolve()}")


if __name__ == "__main__":
    main()
