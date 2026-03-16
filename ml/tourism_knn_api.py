from __future__ import annotations

import os
import sys
import json
import re
from collections import Counter
from difflib import get_close_matches
from datetime import datetime
from pathlib import Path


EXTRA_SITE_PACKAGES = [
    os.getenv("OTT_ML_PYDEPS", ""),
    "D:/downloads/ott_ml_pydeps",
]

for site_packages_path in EXTRA_SITE_PACKAGES:
    if site_packages_path and Path(site_packages_path).exists() and site_packages_path not in sys.path:
        sys.path.insert(0, site_packages_path)

cache_root = Path(os.getenv("OTT_ML_CACHE", "D:/downloads/ott_ml_cache"))
try:
    cache_root.mkdir(parents=True, exist_ok=True)
except Exception:
    cache_root = Path.cwd() / ".ml_cache"
    cache_root.mkdir(parents=True, exist_ok=True)

os.environ.setdefault("HF_HOME", str(cache_root / "hf_home"))
os.environ.setdefault("HUGGINGFACE_HUB_CACHE", str(cache_root / "hf_hub"))
os.environ.setdefault("TRANSFORMERS_CACHE", str(cache_root / "transformers"))
os.environ.setdefault("SENTENCE_TRANSFORMERS_HOME", str(cache_root / "sentence_transformers"))

import pandas as pd
from flask import Flask, jsonify, request
from sentence_transformers import SentenceTransformer
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.cluster import KMeans
from sklearn.impute import SimpleImputer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.neighbors import NearestNeighbors
from sklearn.pipeline import Pipeline
from sklearn.decomposition import TruncatedSVD
from sklearn.preprocessing import MinMaxScaler, OneHotEncoder


DEFAULT_DATASET_PATH = Path(__file__).resolve().parents[1] / "api" / "data" / "indian_travel_dataset.csv"
DEFAULT_EMBEDDING_MODEL = os.getenv("SEMANTIC_MODEL_NAME", "all-MiniLM-L6-v2")

REQUIRED_SCHEMA = {
    "place_name": ["place_name", "Destination Name", "Destination_Name", "title", "name"],
    "state": ["state", "State"],
    "region": ["region", "Region"],
    "category": ["category", "Category"],
    "rating": ["rating", "Rating"],
    "popularity_score": ["popularity_score", "Popularity_Score", "popularity", "score"],
    "budget": ["budget", "Budget", "price", "Price"],
    "best_season": ["best_season", "Best_Season", "season", "Season"],
    "description": ["description", "Description"],
    "popular_attraction": ["popular_attraction", "Popular Attraction", "Popular_Attraction"],
    "accessibility": ["accessibility", "Accessibility"],
}

NUMERIC_FEATURES = ["rating", "popularity_score", "budget"]
CATEGORICAL_FEATURES = ["region", "category"]
FEATURE_COLUMNS = CATEGORICAL_FEATURES + NUMERIC_FEATURES
SIMILARITY_FEATURE_COLUMNS = ["category", "region", "rating", "budget"]
HIDDEN_GEM_LABEL = "hidden_gem_label"
MODEL_CATEGORY_LABEL = "model_category"
CLUSTER_ID_LABEL = "travel_cluster_id"
CLUSTER_NAME_LABEL = "travel_cluster_name"
CLUSTER_DISPLAY_ORDER = ["Budget travel", "Luxury travel", "Hidden gems", "Adventure travel"]
TRENDING_WEIGHTS = {
    "rating": 0.35,
    "clicks": 0.30,
    "search_frequency": 0.20,
    "popularity_score": 0.15,
}

QUERY_ALIAS_MAP = {
    "god s own country": "Kerala",
    "gods own country": "Kerala",
    "paradise on earth": "Kashmir",
    "heaven on earth": "Kashmir",
}

CATEGORY_QUERY_MAP = {
    "beach": "Beach",
    "beaches": "Beach",
    "coastal": "Beach",
    "coast": "Beach",
    "mountain": "Hill Station",
    "mountains": "Hill Station",
    "hill": "Hill Station",
    "hills": "Hill Station",
    "wildlife": "Wildlife",
    "temples": "Temple",
    "heritage": "Temple",
    "adventure": "Adventure",
    "nature": "Garden",
}

CLUSTER_QUERY_MAP = {
    "budget": "Budget travel",
    "cheap": "Budget travel",
    "affordable": "Budget travel",
    "luxury": "Luxury travel",
    "premium": "Luxury travel",
    "hidden gem": "Hidden gems",
    "hidden gems": "Hidden gems",
    "offbeat": "Hidden gems",
    "adventure": "Adventure travel",
}


def resolve_column(columns: list[str], aliases: list[str]) -> str | None:
    lowered = {column.lower(): column for column in columns}
    for alias in aliases:
        match = lowered.get(alias.lower())
        if match:
            return match
    return None


def normalize_region(value: str) -> str:
    region = str(value or "").strip()
    mapping = {
        "north east": "North East",
        "northeast": "North East",
        "north-east": "North East",
    }
    return mapping.get(region.lower(), region or "Unknown")


def normalize_category_label(value: str, description_text: str = "") -> str:
    category = str(value or "").strip().lower()
    description = str(description_text or "").lower()

    if any(keyword in category for keyword in ["beach", "coast", "island"]):
        return "Beach"

    if any(keyword in category for keyword in ["wildlife", "national park", "sanctuary", "forest"]):
        return "Wildlife"

    if any(keyword in category for keyword in ["temple", "religious", "heritage", "pilgrim"]):
        return "Temple"

    if any(keyword in category for keyword in ["hill", "mountain"]) or any(
        keyword in description for keyword in ["hill station", "mountain", "hills", "cool climate"]
    ):
        return "Hill Station"

    if any(keyword in category for keyword in ["adventure", "trek", "rafting", "climb"]):
        return "Adventure"

    if any(keyword in category for keyword in ["nature", "garden", "park", "backwater", "lake"]):
        return "Garden"

    if any(keyword in description for keyword in ["beach", "coast"]):
        return "Beach"
    if any(keyword in description for keyword in ["wildlife", "jungle", "safari"]):
        return "Wildlife"
    if any(keyword in description for keyword in ["temple", "spiritual", "heritage"]):
        return "Temple"
    if any(keyword in description for keyword in ["adventure", "trek", "rafting"]):
        return "Adventure"

    return "Garden"


def normalize_lookup_text(value: str) -> str:
    cleaned = re.sub(r"[^a-z0-9\s]+", " ", str(value or "").lower())
    return re.sub(r"\s+", " ", cleaned).strip()


def min_max_normalize(series: pd.Series) -> pd.Series:
    numeric = pd.to_numeric(series, errors="coerce").fillna(0)
    min_v = numeric.min()
    max_v = numeric.max()
    if max_v == min_v:
        return pd.Series([0.0] * len(series), index=series.index)
    return (numeric - min_v) / (max_v - min_v)


def normalize_image_category(folder_or_predicted: str) -> str:
    value = str(folder_or_predicted or "").strip().lower()
    if any(keyword in value for keyword in ["beach", "coast", "sea", "shore"]):
        return "beach"
    if any(keyword in value for keyword in ["mountain", "hill", "peak", "alps", "volcano"]):
        return "mountain"
    if any(keyword in value for keyword in ["temple", "church", "mosque", "pagoda", "monastery", "palace"]):
        return "temple"
    if any(keyword in value for keyword in ["waterfall", "cascade", "fountain", "geyser"]):
        return "waterfall"
    if any(keyword in value for keyword in ["forest", "jungle", "wood", "grove", "park", "garden"]):
        return "forest"
    return "forest"


def derive_rating(index: int) -> float:
    return round(4.0 + ((index * 3) % 10) / 10, 1)


def derive_popularity(index: int) -> int:
    return 25 + ((index * 17) % 70)


def derive_budget(category: str, index: int) -> int:
    base_budget = {
        "Beach": 2400,
        "Heritage": 2200,
        "Nature": 2000,
        "Adventure": 2600,
        "Religious": 1800,
    }
    base = base_budget.get(str(category).strip(), 2100)
    adjustment = ((index % 5) - 2) * 150
    return int(base + adjustment)


def derive_best_season(region: str) -> str:
    season_by_region = {
        "North": "Summer",
        "South": "Winter",
        "East": "Winter",
        "West": "Winter",
        "North East": "Spring",
    }
    return season_by_region.get(normalize_region(region), "Winter")


def compose_description(row: pd.Series) -> str:
    parts = [
        f"{row['place_name']} is a {row['category'].lower()} destination in {row['state']}, {row['region']} India.",
        f"Best season to visit is {row['best_season']}.",
        f"It has a rating of {row['rating']:.1f} and a popularity score of {int(row['popularity_score'])}.",
        f"Typical travel budget is around ₹{int(row['budget'])}.",
    ]

    if row.get("popular_attraction"):
        parts.append(f"Popular attraction: {row['popular_attraction']}.")
    if row.get("accessibility"):
        parts.append(f"Accessibility: {row['accessibility']}.")
    if row.get("description"):
        parts.append(str(row["description"]))

    return " ".join(part for part in parts if part)


def load_and_prepare_dataset(csv_path: str | Path) -> pd.DataFrame:
    df = pd.read_csv(csv_path)

    has_rating_in_source = resolve_column(df.columns.tolist(), REQUIRED_SCHEMA["rating"]) is not None
    has_popularity_in_source = resolve_column(df.columns.tolist(), REQUIRED_SCHEMA["popularity_score"]) is not None
    has_budget_in_source = resolve_column(df.columns.tolist(), REQUIRED_SCHEMA["budget"]) is not None

    renamed = {}
    for canonical_name, aliases in REQUIRED_SCHEMA.items():
        column = resolve_column(df.columns.tolist(), aliases)
        if column:
            renamed[column] = canonical_name

    df = df.rename(columns=renamed)

    missing_required = [
        column for column in ["place_name", "state", "region", "category"] if column not in df.columns
    ]
    if missing_required:
        raise ValueError(f"Dataset missing required columns: {missing_required}")

    df = df.copy().reset_index(drop=True)

    if "rating" not in df.columns:
        df["rating"] = [derive_rating(index) for index in df.index]
    if "popularity_score" not in df.columns:
        df["popularity_score"] = [derive_popularity(index) for index in df.index]
    if "budget" not in df.columns:
        df["budget"] = [derive_budget(df.at[index, "category"], index) for index in df.index]
    if "best_season" not in df.columns:
        df["best_season"] = [derive_best_season(df.at[index, "region"]) for index in df.index]
    if "description" not in df.columns:
        df["description"] = ""
    if "popular_attraction" not in df.columns:
        df["popular_attraction"] = ""
    if "accessibility" not in df.columns:
        df["accessibility"] = ""

    df = df[
        [
            "place_name",
            "state",
            "region",
            "category",
            "rating",
            "popularity_score",
            "budget",
            "best_season",
            "description",
            "popular_attraction",
            "accessibility",
        ]
    ].copy()

    for column in NUMERIC_FEATURES:
        df[column] = pd.to_numeric(df[column], errors="coerce")

    for index in df.index:
        if pd.isna(df.at[index, "rating"]):
            df.at[index, "rating"] = derive_rating(index)
        if pd.isna(df.at[index, "popularity_score"]):
            df.at[index, "popularity_score"] = derive_popularity(index)
        if pd.isna(df.at[index, "budget"]):
            df.at[index, "budget"] = derive_budget(df.at[index, "category"], index)
        if not str(df.at[index, "best_season"] or "").strip():
            df.at[index, "best_season"] = derive_best_season(df.at[index, "region"])

    # If numeric quality fields are entirely missing in source data,
    # calibrate a few rows as realistic hidden-gem candidates so
    # strict rule-based labeling can produce usable examples.
    if not has_rating_in_source and not has_popularity_in_source and not has_budget_in_source:
        for index in range(0, len(df), 7):
            df.at[index, "rating"] = max(float(df.at[index, "rating"]), 4.7)
            df.at[index, "popularity_score"] = min(float(df.at[index, "popularity_score"]), 55.0)
            df.at[index, "budget"] = 2100 + (index % 3) * 120

    for column in [
        "place_name",
        "state",
        "region",
        "category",
        "best_season",
        "description",
        "popular_attraction",
        "accessibility",
    ]:
        df[column] = df[column].fillna("").astype(str).str.strip()

    df["region"] = df["region"].apply(normalize_region)
    df = df.drop_duplicates(subset=["place_name"], keep="first").reset_index(drop=True)
    df["semantic_text"] = df.apply(compose_description, axis=1)
    return df


def build_knn_pipeline() -> Pipeline:
    preprocessor = ColumnTransformer(
        transformers=[
            (
                "categorical",
                Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="most_frequent")),
                        ("encoder", OneHotEncoder(handle_unknown="ignore")),
                    ]
                ),
                CATEGORICAL_FEATURES,
            ),
            (
                "numeric",
                Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="median")),
                        ("scaler", MinMaxScaler()),
                    ]
                ),
                NUMERIC_FEATURES,
            ),
        ]
    )

    return Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("knn", NearestNeighbors(metric="cosine", algorithm="brute", n_neighbors=6)),
        ]
    )


def build_hidden_gem_pipeline() -> Pipeline:
    preprocessor = ColumnTransformer(
        transformers=[
            (
                "categorical",
                Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="most_frequent")),
                        ("encoder", OneHotEncoder(handle_unknown="ignore")),
                    ]
                ),
                CATEGORICAL_FEATURES,
            ),
            (
                "numeric",
                Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="median")),
                        ("scaler", MinMaxScaler()),
                    ]
                ),
                NUMERIC_FEATURES,
            ),
        ]
    )

    return Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            (
                "classifier",
                RandomForestClassifier(
                    n_estimators=250,
                    random_state=42,
                    class_weight="balanced",
                ),
            ),
        ]
    )


def build_category_classifier_pipeline() -> Pipeline:
    return Pipeline(
        steps=[
            (
                "tfidf",
                TfidfVectorizer(
                    ngram_range=(1, 2),
                    min_df=1,
                    max_features=8000,
                    sublinear_tf=True,
                ),
            ),
            (
                "classifier",
                LogisticRegression(
                    max_iter=1200,
                    class_weight="balanced",
                    random_state=42,
                ),
            ),
        ]
    )


def build_cluster_preprocessor() -> ColumnTransformer:
    return ColumnTransformer(
        transformers=[
            (
                "numeric",
                Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="median")),
                        ("scaler", MinMaxScaler()),
                    ]
                ),
                NUMERIC_FEATURES,
            ),
            (
                "region",
                Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="most_frequent")),
                        ("encoder", OneHotEncoder(handle_unknown="ignore")),
                    ]
                ),
                ["region"],
            ),
        ]
    )


def build_similarity_preprocessor() -> ColumnTransformer:
    return ColumnTransformer(
        transformers=[
            (
                "categorical",
                Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="most_frequent")),
                        ("encoder", OneHotEncoder(handle_unknown="ignore")),
                    ]
                ),
                ["category", "region"],
            ),
            (
                "numeric",
                Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="median")),
                        ("scaler", MinMaxScaler()),
                    ]
                ),
                ["rating", "budget"],
            ),
        ]
    )


class DestinationRecommender:
    def __init__(self, dataset_path: str | Path):
        self.dataset_path = Path(dataset_path)
        self.data_dir = Path(__file__).resolve().parent / "data"
        self.data_dir.mkdir(parents=True, exist_ok=True)

        self.interaction_log_path = self.data_dir / "user_interactions.csv"
        self.trending_cache_path = self.data_dir / "trending_rankings.json"
        self.image_assignment_json_path = self.data_dir / "image_category_assignments.json"
        self.image_assignment_csv_path = self.data_dir / "image_category_assignments.csv"

        self.default_image_dataset_root = (
            Path(__file__).resolve().parents[1] / "client" / "public" / "assets" / "raw-dataset"
        )

        self.df = load_and_prepare_dataset(self.dataset_path)
        self.embedding_model = SentenceTransformer(DEFAULT_EMBEDDING_MODEL)
        self.embeddings = self.embedding_model.encode(
            self.df["semantic_text"].tolist(),
            normalize_embeddings=True,
            show_progress_bar=False,
        )

        self.knn_pipeline = build_knn_pipeline()
        self.features = self.df[FEATURE_COLUMNS]
        transformed = self.knn_pipeline.named_steps["preprocessor"].fit_transform(self.features)
        self.knn_pipeline.named_steps["knn"].fit(transformed)
        self.transformed_features = transformed

        self.hidden_gem_pipeline = build_hidden_gem_pipeline()
        self._prepare_hidden_gem_model()

        self.category_classifier = build_category_classifier_pipeline()
        self._prepare_category_classifier()

        self.cluster_preprocessor = build_cluster_preprocessor()
        self.cluster_model = KMeans(n_clusters=4, random_state=42, n_init=20)
        self._prepare_clusters()

        self.similarity_preprocessor = build_similarity_preprocessor()
        self.similarity_matrix = self.similarity_preprocessor.fit_transform(
            self.df[SIMILARITY_FEATURE_COLUMNS]
        )

        self.cf_model = None
        self.cf_user_index = {}
        self.cf_item_index = {}
        self.cf_matrix = None
        self.association_graph = {}
        self._prepare_interaction_store()
        self._refresh_collaborative_filtering_model()
        self._refresh_association_model()

        self.cnn_model = None
        self.cnn_transform = None
        self.cnn_device = "cpu"
        self.cnn_imagenet_labels = []

    def _to_similarity_query_frame(
        self,
        category: str | None,
        region: str | None,
        rating: float | None,
        budget: float | None,
    ) -> pd.DataFrame:
        fallback = self.df.iloc[0]
        return pd.DataFrame(
            [
                {
                    "category": str(category or fallback["category"]),
                    "region": normalize_region(region or fallback["region"]),
                    "rating": float(rating if rating is not None else fallback["rating"]),
                    "budget": float(budget if budget is not None else fallback["budget"]),
                }
            ]
        )

    def similar_destinations(
        self,
        destination: str | None = None,
        category: str | None = None,
        region: str | None = None,
        rating: float | None = None,
        budget: float | None = None,
        top_k: int = 8,
        min_similarity: float = 0.45,
    ) -> dict:
        reference_payload = None
        reference_vector = None
        excluded_index = None

        if destination:
            index = self.find_destination_index(destination, require_strict=True)
            if index is None:
                suggestions = self.suggest_destination_names(destination, limit=5)
                if suggestions:
                    raise LookupError(
                        f"Destination '{destination}' was not found in AI dataset. Try: {', '.join(suggestions)}"
                    )
                raise LookupError(f"Destination '{destination}' was not found in AI dataset")
            else:
                excluded_index = index
                reference_row = self.df.iloc[index]
                reference_payload = self._row_to_payload(reference_row)
                query_frame = pd.DataFrame([reference_row[SIMILARITY_FEATURE_COLUMNS].to_dict()])
                reference_vector = self.similarity_preprocessor.transform(query_frame)
        else:
            if not any(value is not None and str(value).strip() for value in [category, region, rating, budget]):
                raise ValueError("Provide destination or at least one of category/region/rating/budget")
            query_frame = self._to_similarity_query_frame(category, region, rating, budget)
            reference_vector = self.similarity_preprocessor.transform(query_frame)
            reference_payload = query_frame.iloc[0].to_dict()

        similarities = cosine_similarity(reference_vector, self.similarity_matrix)[0]

        ranked_indices = similarities.argsort()[::-1]
        results = []
        for index in ranked_indices:
            if excluded_index is not None and int(index) == int(excluded_index):
                continue
            if float(similarities[int(index)]) < float(min_similarity):
                continue
            row = self.df.iloc[int(index)]
            payload = self._row_to_payload(row)
            payload["cosine_similarity"] = round(float(similarities[int(index)]), 4)
            results.append(payload)
            if len(results) >= top_k:
                break

        return {
            "feature_space": ["category", "region", "rating", "budget"],
            "query": reference_payload,
            "min_similarity": float(min_similarity),
            "count": len(results),
            "results": results,
        }

    def suggest_destination_names(self, query: str, limit: int = 5) -> list[str]:
        normalized_query = str(query or "").strip().lower()
        if not normalized_query:
            return []

        names = self.df["place_name"].astype(str).tolist()
        ranked = []

        contains_matches = [
            name for name in names
            if normalized_query in name.lower() or name.lower() in normalized_query
        ]
        ranked.extend(contains_matches)

        close_matches = get_close_matches(query.strip(), names, n=limit * 2, cutoff=0.45)
        ranked.extend(close_matches)

        deduped = []
        seen = set()
        for name in ranked:
            key = name.strip().lower()
            if key in seen:
                continue
            seen.add(key)
            deduped.append(name)
            if len(deduped) >= limit:
                break

        return deduped

    def create_itinerary(
        self,
        budget: float,
        number_of_days: int,
        preferred_category: str,
        region: str,
    ) -> dict:
        total_budget = max(float(budget), 500.0)
        days = max(int(number_of_days), 1)
        category_norm = str(preferred_category or "Any").strip()
        region_norm = normalize_region(str(region or "Any").strip())

        candidates = self.df.copy()
        if region_norm and region_norm != "Any":
            candidates = candidates[candidates["region"].str.lower() == region_norm.lower()]

        if category_norm and category_norm != "Any":
            normalized_pref = normalize_category_label(category_norm, category_norm)
            category_mask = candidates.apply(
                lambda row: normalize_category_label(
                    row.get("predicted_category", row.get("category", "")),
                    row.get("semantic_text", ""),
                )
                == normalized_pref,
                axis=1,
            )
            candidates = candidates[category_mask]

        if candidates.empty:
            candidates = self.df.copy()

        per_day_budget = total_budget / max(days, 1)

        scored = candidates.copy()
        scored["budget_fit"] = 1 - (
            (scored["budget"] - per_day_budget).abs() /
            max(float(scored["budget"].max() - scored["budget"].min()), 1.0)
        )
        scored["planner_score"] = (
            0.45 * (scored["rating"] / 5.0)
            + 0.25 * scored["budget_fit"].clip(lower=0)
            + 0.20 * (1 - (scored["popularity_score"] / max(float(scored["popularity_score"].max()), 1.0)))
            + 0.10 * scored["hidden_gem_probability"].fillna(0)
        )

        picks = scored.sort_values("planner_score", ascending=False).head(max(days * 2, 8)).reset_index(drop=True)

        plan_rows = []
        if picks.empty:
            picks = self.df.head(days).reset_index(drop=True)

        for day in range(1, days + 1):
            row = picks.iloc[(day - 1) % len(picks)]
            destination_payload = self._row_to_payload(row)
            estimated_day_cost = round(float(min(per_day_budget, row["budget"] * 1.15)), 2)
            plan_rows.append(
                {
                    "day": day,
                    "destination": destination_payload,
                    "estimated_day_cost": estimated_day_cost,
                    "highlight": f"Explore {row['place_name']} ({row['category']}) in {row['state']}.",
                }
            )

        total_estimated = round(sum(item["estimated_day_cost"] for item in plan_rows), 2)
        return {
            "inputs": {
                "budget": total_budget,
                "number_of_days": days,
                "preferred_category": category_norm,
                "region": region_norm,
            },
            "summary": {
                "destinations_planned": len(plan_rows),
                "estimated_total_cost": total_estimated,
                "budget_feasible": total_estimated <= total_budget * 1.05,
            },
            "itinerary": plan_rows,
        }

    def _extract_number(self, text: str, pattern: str) -> float | None:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if not match:
            return None
        try:
            return float(match.group(1).replace(",", ""))
        except Exception:
            return None

    def _extract_region_from_text(self, text: str) -> str | None:
        lowered = text.lower()
        for region in ["North East", "North", "South", "East", "West"]:
            if region.lower() in lowered:
                return region
        return None

    def _extract_category_from_text(self, text: str) -> str | None:
        lowered = normalize_lookup_text(text)
        explicit_category = CATEGORY_QUERY_MAP.get(lowered)
        if explicit_category:
            return explicit_category

        category_keywords = {
            "Beach": ["beach", "coast", "island"],
            "Hill Station": ["hill", "mountain", "trek"],
            "Temple": ["temple", "religious", "heritage", "spiritual"],
            "Adventure": ["adventure", "rafting", "safari", "trekking"],
            "Wildlife": ["wildlife", "jungle", "national park"],
            "Garden": ["nature", "forest", "garden", "lake", "waterfall"],
        }
        for label, keywords in category_keywords.items():
            if any(keyword in lowered for keyword in keywords):
                return label
        return None

    def _canonicalize_query(self, text: str) -> str:
        query = str(text or "").strip()
        normalized = normalize_lookup_text(query)
        for alias, target in QUERY_ALIAS_MAP.items():
            if normalized == alias or normalized.endswith(alias) or f" {alias} " in f" {normalized} ":
                return target
        return query

    def _find_state_matches(self, query: str, limit: int = 5) -> pd.DataFrame:
        normalized_query = normalize_lookup_text(query)
        if not normalized_query:
            return self.df.head(0).copy()

        state_series = self.df["state"].astype(str).apply(normalize_lookup_text)
        matches = self.df[state_series == normalized_query].copy()

        if matches.empty:
            partial_mask = state_series.str.contains(normalized_query, na=False)
            matches = self.df[partial_mask].copy()

        if matches.empty:
            token_set = set(normalized_query.split())
            overlap_mask = state_series.apply(
                lambda value: bool(value) and (value in normalized_query or any(token in token_set for token in value.split()))
            )
            matches = self.df[overlap_mask].copy()

        if matches.empty:
            return matches

        return matches.sort_values(
            ["hidden_gem_probability", "rating", "popularity_score"],
            ascending=[False, False, True],
        ).drop_duplicates(subset=["place_name"]).head(limit)

    def _get_cluster_neighbors(
        self,
        cluster_name: str,
        exclude_places: set[str] | None = None,
        region: str | None = None,
        limit: int = 4,
    ) -> list[dict]:
        candidates = self.df[self.df[CLUSTER_NAME_LABEL] == cluster_name].copy()
        if region and region != "Any":
            candidates = candidates[candidates["region"].str.lower() == region.strip().lower()]

        if exclude_places:
            normalized_excludes = {place.strip().lower() for place in exclude_places}
            candidates = candidates[
                ~candidates["place_name"].str.lower().isin(normalized_excludes)
            ]

        candidates = candidates.sort_values(
            ["hidden_gem_probability", "rating", "popularity_score"],
            ascending=[False, False, True],
        ).head(limit)

        return [self._row_to_payload(row) for _, row in candidates.iterrows()]

    def _record_chatbot_interaction(
        self,
        session_id: str,
        query: str,
        destination_name: str = "",
        category: str = "",
        event_type: str = "search",
    ) -> None:
        try:
            self.track_interaction(
                user_id=session_id or "default",
                event_type=event_type,
                query=query,
                destination_name=destination_name,
                category=category,
            )
        except Exception:
            pass

    def chatbot_assistant(self, message: str, session_id: str = "default") -> dict:
        query = str(message or "").strip()
        if not query:
            raise ValueError("message is required")

        canonical_query = self._canonicalize_query(query)
        lowered = normalize_lookup_text(canonical_query)
        region = self._extract_region_from_text(canonical_query) or "Any"
        category = self._extract_category_from_text(canonical_query) or "Any"
        state_matches = self._find_state_matches(canonical_query, limit=5)
        destination_index = self.find_destination_index(canonical_query, require_strict=False)
        best_time_requested = any(keyword in lowered for keyword in ["best time", "when to go", "ideal season", "weather"])

        for keyword, cluster_name in CLUSTER_QUERY_MAP.items():
            if keyword in lowered:
                cluster_payload = self.get_clusters(region=region if region != "Any" else None, limit_per_cluster=4)
                selected_cluster = next(
                    (cluster for cluster in cluster_payload["clusters"] if cluster["cluster_name"] == cluster_name),
                    None,
                )
                if selected_cluster:
                    names = [row["place_name"] for row in selected_cluster["destinations"][:4]]
                    self._record_chatbot_interaction(
                        session_id=session_id,
                        query=query,
                        destination_name=names[0] if names else "",
                        category=cluster_name,
                        event_type="semantic_search",
                    )
                    return {
                        "response": (
                            f"Using unsupervised clustering, I grouped similar trips into a {cluster_name} cluster. "
                            f"Top matches{f' in {region}' if region != 'Any' else ''}: {', '.join(names)}."
                        ),
                        "type": "cluster_explorer",
                        "results": selected_cluster["destinations"],
                        "cluster": selected_cluster,
                        "suggestions": [
                            f"Show hidden gems{f' in {region}' if region != 'Any' else ''}",
                            f"Plan a {cluster_name.lower()} itinerary",
                            "Recommend similar destinations",
                        ],
                    }

        if any(keyword in lowered for keyword in ["plan", "itinerary", "trip plan", "schedule"]):
            budget = self._extract_number(canonical_query, r"(?:₹|rs\.?|inr)?\s*(\d{3,7})") or 20000.0
            days = int(self._extract_number(canonical_query, r"(\d+)\s*(?:days?|nights?)") or 4)
            planner = self.create_itinerary(
                budget=budget,
                number_of_days=days,
                preferred_category=category,
                region=region,
            )
            top_names = [item["destination"]["place_name"] for item in planner["itinerary"][:3]]
            self._record_chatbot_interaction(
                session_id=session_id,
                query=query,
                destination_name=top_names[0] if top_names else "",
                category=category,
                event_type="semantic_search",
            )
            return {
                "response": (
                    f"Here's a {planner['inputs']['number_of_days']}-day travel plan within about ₹{int(planner['inputs']['budget'])}. "
                    f"Top picks include {', '.join(top_names)}."
                ),
                "type": "itinerary",
                "itinerary": planner,
                "suggestions": [
                    "Show hidden gems in this region",
                    "Recommend similar destinations",
                    "Optimize itinerary for lower budget",
                ],
            }

        if "hidden gem" in lowered or "offbeat" in lowered:
            gems = self.get_hidden_gems(top_k=5, region=region if region != "Any" else None)
            gem_names = [row["place_name"] for row in gems["results"][:5]]
            self._record_chatbot_interaction(
                session_id=session_id,
                query=query,
                destination_name=gem_names[0] if gem_names else "",
                category="Hidden gems",
                event_type="semantic_search",
            )
            return {
                "response": (
                    f"Great choice! Here are offbeat hidden gems{f' in {region}' if region != 'Any' else ''}: "
                    f"{', '.join(gem_names)}."
                ),
                "type": "hidden_gems",
                "results": gems["results"],
                "suggestions": [
                    "Plan a 4-day itinerary",
                    "Show budget-friendly options",
                    "Recommend similar places",
                ],
            }

        if not state_matches.empty and (
            len(lowered.split()) <= 4
            or any(keyword in lowered for keyword in ["about", "visit", "places", "where", "best time"])
        ):
            primary_row = state_matches.iloc[0]
            state_name = str(primary_row["state"])
            top_rows = state_matches.head(5)
            top_names = top_rows["place_name"].tolist()
            cluster_mix = top_rows[CLUSTER_NAME_LABEL].value_counts().to_dict()
            cluster_summary = ", ".join(f"{name}: {count}" for name, count in cluster_mix.items())
            category_summary = ", ".join(top_rows["category"].dropna().astype(str).unique()[:3])
            association_payload = self.get_associated_destinations(primary_row["place_name"], top_k=3)
            association_names = [row["place_name"] for row in association_payload["results"][:3]]

            response_parts = [
                f"{state_name} is excellent for {category_summary or 'diverse'} experiences.",
                (
                    f"Best time to start planning is {top_rows['best_season'].mode().iloc[0]}."
                    if best_time_requested and not top_rows["best_season"].mode().empty
                    else f"Top dataset matches are {', '.join(top_names)}."
                ),
                f"Unsupervised clustering groups this state into patterns like {cluster_summary}." if cluster_summary else "",
                (
                    f"Association learning shows travellers who search {primary_row['place_name']} also explore {', '.join(association_names)}."
                    if association_names
                    else ""
                ),
            ]

            self._record_chatbot_interaction(
                session_id=session_id,
                query=query,
                destination_name=primary_row["place_name"],
                category=state_name,
                event_type="search",
            )

            return {
                "response": " ".join(part for part in response_parts if part),
                "type": "state_explorer",
                "results": [self._row_to_payload(row) for _, row in top_rows.iterrows()],
                "associated_results": association_payload["results"],
                "suggestions": [
                    f"Best time for {state_name}",
                    f"Hidden gems in {state_name}",
                    f"Plan a trip to {state_name}",
                ],
            }

        if destination_index is not None or any(keyword in lowered for keyword in ["recommend", "similar", "where", "visit", "destination"]):
            if destination_index is not None:
                place_match = str(self.df.iloc[destination_index]["place_name"])
                similar = self.similar_destinations(destination=place_match, top_k=5, min_similarity=0.2)
                names = [row["place_name"] for row in similar["results"][:5]]
                place_row = self.df.iloc[destination_index]
                association_payload = self.get_associated_destinations(place_match, top_k=3)
                association_names = [row["place_name"] for row in association_payload["results"][:3]]
                cluster_neighbors = self._get_cluster_neighbors(
                    cluster_name=str(place_row.get(CLUSTER_NAME_LABEL, "Budget travel")),
                    exclude_places={place_match},
                    region=str(place_row.get("region", "Any")),
                    limit=3,
                )
                cluster_names = [row["place_name"] for row in cluster_neighbors]
                season_note = f" Best time to visit is {place_row['best_season']}." if best_time_requested else ""
                self._record_chatbot_interaction(
                    session_id=session_id,
                    query=query,
                    destination_name=place_match,
                    category=str(place_row.get("category", "")),
                    event_type="search",
                )
                return {
                    "response": (
                        f"{place_match} is a {place_row['category'].lower()} destination in {place_row['state']}, {place_row['region']} India.{season_note} "
                        f"Unsupervised clustering places it in our {place_row.get(CLUSTER_NAME_LABEL, 'Budget travel')} cluster. "
                        f"If you liked {place_match}, you may also enjoy: {', '.join(names)}."
                        f"{' Travellers also commonly pair it with ' + ', '.join(association_names) + '.' if association_names else ''}"
                        f"{' Nearby cluster matches include ' + ', '.join(cluster_names) + '.' if cluster_names else ''}"
                    ),
                    "type": "recommendations",
                    "results": similar["results"],
                    "associated_results": association_payload["results"],
                    "cluster_results": cluster_neighbors,
                    "suggestions": [
                        f"Plan itinerary around {place_match}",
                        "Show hidden gems nearby",
                        "Find beach destinations in South India",
                    ],
                }

            semantic = self.semantic_search(query=canonical_query, top_k=5, region=region if region != "Any" else None)
            names = [row["place_name"] for row in semantic["results"][:5]]
            anchor_place = names[0] if names else ""
            association_payload = self.get_associated_destinations(anchor_place or canonical_query, top_k=3)
            self._record_chatbot_interaction(
                session_id=session_id,
                query=query,
                destination_name=anchor_place,
                category=category,
                event_type="semantic_search",
            )
            return {
                "response": f"Based on your query, top destination matches are: {', '.join(names)}.",
                "type": "dataset_qa",
                "results": semantic["results"],
                "associated_results": association_payload["results"],
                "suggestions": [
                    "Show hidden gems",
                    "Create a travel plan for 5 days",
                    "Recommend similar destinations",
                ],
            }

        qa_results = self.semantic_search(query=canonical_query, top_k=3, region=region if region != "Any" else None)
        snippets = [
            f"{item['place_name']} ({item['category']}, {item['region']})"
            for item in qa_results["results"]
        ]

        self._record_chatbot_interaction(
            session_id=session_id,
            query=query,
            destination_name=qa_results["results"][0]["place_name"] if qa_results["results"] else "",
            category=category,
            event_type="semantic_search",
        )

        return {
            "response": (
                "I can help with tourism questions using our India dataset. "
                f"You might explore: {', '.join(snippets)}."
            ),
            "type": "dataset_qa",
            "results": qa_results["results"],
            "suggestions": [
                "Recommend destinations in South India",
                "Show hidden gems",
                "Plan a 3-day budget trip",
            ],
        }

    def _prepare_interaction_store(self) -> None:
        if self.interaction_log_path.exists():
            return

        empty = pd.DataFrame(
            columns=[
                "timestamp",
                "user_id",
                "event_type",
                "query",
                "destination_name",
                "category",
            ]
        )
        empty.to_csv(self.interaction_log_path, index=False)

    def _resolve_destination_from_text(self, text: str) -> str | None:
        candidate = normalize_lookup_text(self._canonicalize_query(text))
        if not candidate:
            return None

        exact = self.df[self.df["place_name"].apply(normalize_lookup_text) == candidate]
        if not exact.empty:
            return str(exact.iloc[0]["place_name"])

        state_matches = self._find_state_matches(candidate, limit=1)
        if not state_matches.empty:
            return str(state_matches.iloc[0]["place_name"])

        contains = self.df[self.df["place_name"].apply(normalize_lookup_text).str.contains(candidate, na=False)]
        if not contains.empty:
            return str(contains.iloc[0]["place_name"])

        return None

    def _load_interactions(self) -> pd.DataFrame:
        self._prepare_interaction_store()
        interactions = pd.read_csv(self.interaction_log_path)
        if interactions.empty:
            return interactions

        for column in ["timestamp", "user_id", "event_type", "query", "destination_name", "category"]:
            if column not in interactions.columns:
                interactions[column] = ""

        interactions["timestamp"] = interactions["timestamp"].fillna("").astype(str)
        interactions["user_id"] = interactions["user_id"].fillna("").astype(str)
        interactions["event_type"] = interactions["event_type"].fillna("").astype(str)
        interactions["query"] = interactions["query"].fillna("").astype(str)
        interactions["destination_name"] = interactions["destination_name"].fillna("").astype(str)
        interactions["category"] = interactions["category"].fillna("").astype(str)
        return interactions

    def _event_weight(self, event_type: str) -> float:
        event = str(event_type or "").lower()
        if event in {"click", "tourism_click", "destination_click", "view", "view_place", "destination_view"}:
            return 3.0
        if event in {"search", "semantic_search", "suggestion_select"}:
            return 1.5
        if event in {"category_pref", "category_preference"}:
            return 1.2
        return 1.0

    def _refresh_collaborative_filtering_model(self) -> None:
        interactions = self._load_interactions()
        if interactions.empty:
            self.cf_model = None
            self.cf_user_index = {}
            self.cf_item_index = {}
            self.cf_matrix = None
            return

        rows = []

        for _, interaction in interactions.iterrows():
            user_id = str(interaction.get("user_id", "")).strip()
            if not user_id:
                continue

            destination_name = str(interaction.get("destination_name", "")).strip()
            query = str(interaction.get("query", "")).strip()
            category = str(interaction.get("category", "")).strip()
            weight = self._event_weight(interaction.get("event_type", ""))

            resolved_destination = self._resolve_destination_from_text(destination_name) or self._resolve_destination_from_text(query)

            if resolved_destination:
                rows.append({"user_id": user_id, "place_name": resolved_destination, "weight": weight})
                continue

            if category:
                category_norm = normalize_category_label(category, category)
                category_matches = self.df[
                    self.df[MODEL_CATEGORY_LABEL].fillna(self.df["category"]).apply(
                        lambda value: normalize_category_label(value, value)
                    )
                    == category_norm
                ]
                for _, match in category_matches.head(5).iterrows():
                    rows.append(
                        {
                            "user_id": user_id,
                            "place_name": str(match["place_name"]),
                            "weight": weight * 0.4,
                        }
                    )

        if not rows:
            self.cf_model = None
            self.cf_user_index = {}
            self.cf_item_index = {}
            self.cf_matrix = None
            return

        matrix_df = pd.DataFrame(rows)
        matrix_df = matrix_df.groupby(["user_id", "place_name"], as_index=False)["weight"].sum()

        user_ids = sorted(matrix_df["user_id"].unique())
        place_names = sorted(matrix_df["place_name"].unique())

        self.cf_user_index = {user_id: index for index, user_id in enumerate(user_ids)}
        self.cf_item_index = {place_name: index for index, place_name in enumerate(place_names)}

        matrix = pd.DataFrame(0.0, index=user_ids, columns=place_names)
        for _, row in matrix_df.iterrows():
            matrix.at[row["user_id"], row["place_name"]] = float(row["weight"])

        self.cf_matrix = matrix

        # TruncatedSVD requires at least 2 features and meaningful matrix shape.
        if matrix.shape[0] < 2 or matrix.shape[1] < 2:
            self.cf_model = None
            return

        n_components = min(8, matrix.shape[1] - 1, matrix.shape[0] - 1)
        if n_components < 1:
            self.cf_model = None
            return

        model = TruncatedSVD(n_components=n_components, random_state=42)
        latent_users = model.fit_transform(matrix.values)
        reconstructed = latent_users @ model.components_

        self.cf_model = {
            "svd": model,
            "latent_users": latent_users,
            "reconstructed": reconstructed,
            "user_ids": user_ids,
            "place_names": place_names,
        }

    def _refresh_association_model(self) -> None:
        interactions = self._load_interactions()
        self.association_graph = {}

        if interactions.empty:
            return

        resolved_rows = []
        for _, interaction in interactions.iterrows():
            user_id = str(interaction.get("user_id", "")).strip()
            if not user_id:
                continue

            resolved_destination = (
                self._resolve_destination_from_text(interaction.get("destination_name", ""))
                or self._resolve_destination_from_text(interaction.get("query", ""))
            )
            if not resolved_destination:
                continue

            resolved_rows.append(
                {
                    "user_id": user_id,
                    "timestamp": interaction.get("timestamp", ""),
                    "resolved_destination": resolved_destination,
                }
            )

        if not resolved_rows:
            return

        resolved_df = pd.DataFrame(resolved_rows)
        resolved_df["timestamp"] = pd.to_datetime(resolved_df["timestamp"], errors="coerce")
        resolved_df = resolved_df.sort_values(["user_id", "timestamp"], na_position="last")

        sequences = []
        for _, group in resolved_df.groupby("user_id"):
            ordered = []
            seen = set()
            for destination_name in group["resolved_destination"].tolist():
                key = str(destination_name).strip().lower()
                if not key or key in seen:
                    continue
                seen.add(key)
                ordered.append(str(destination_name))
            if len(ordered) >= 2:
                sequences.append(ordered)

        if not sequences:
            return

        destination_support = Counter()
        pair_counts = Counter()
        total_sequences = len(sequences)

        for sequence in sequences:
            for seed in sequence:
                destination_support[seed] += 1
            for seed in sequence:
                for related in sequence:
                    if seed == related:
                        continue
                    pair_counts[(seed, related)] += 1

        association_graph = {}
        for (seed, related), pair_count in pair_counts.items():
            support = pair_count / max(total_sequences, 1)
            confidence = pair_count / max(destination_support[seed], 1)
            association_graph.setdefault(seed, []).append(
                {
                    "place_name": related,
                    "support": round(float(support), 4),
                    "confidence": round(float(confidence), 4),
                    "association_score": round(float((confidence * 0.7) + (support * 0.3)), 4),
                }
            )

        for seed, related_rows in association_graph.items():
            association_graph[seed] = sorted(
                related_rows,
                key=lambda row: (row["association_score"], row["confidence"], row["support"]),
                reverse=True,
            )

        self.association_graph = association_graph

    def track_interaction(
        self,
        user_id: str,
        event_type: str,
        query: str = "",
        destination_name: str = "",
        category: str = "",
    ) -> None:
        interaction = pd.DataFrame(
            [
                {
                    "timestamp": datetime.utcnow().isoformat(),
                    "user_id": str(user_id or "").strip(),
                    "event_type": str(event_type or "").strip(),
                    "query": str(query or "").strip(),
                    "destination_name": str(destination_name or "").strip(),
                    "category": str(category or "").strip(),
                }
            ]
        )

        exists = self.interaction_log_path.exists()
        interaction.to_csv(
            self.interaction_log_path,
            mode="a",
            index=False,
            header=not exists,
        )
        self._refresh_collaborative_filtering_model()
        self._refresh_association_model()

    def get_associated_destinations(self, query: str, top_k: int = 5) -> dict:
        seeds = []
        canonical_query = self._canonicalize_query(query)

        destination_index = self.find_destination_index(canonical_query, require_strict=False)
        if destination_index is not None:
            seeds.append(str(self.df.iloc[destination_index]["place_name"]))

        state_matches = self._find_state_matches(canonical_query, limit=3)
        for place_name in state_matches["place_name"].tolist():
            if place_name not in seeds:
                seeds.append(place_name)

        candidate_rows = {}
        for seed in seeds[:3]:
            for related in self.association_graph.get(seed, []):
                place_name = str(related["place_name"])
                if place_name in seeds:
                    continue
                existing = candidate_rows.get(place_name)
                if existing is None or related["association_score"] > existing["association_score"]:
                    candidate_rows[place_name] = related

        if candidate_rows:
            ranked_rows = sorted(
                candidate_rows.values(),
                key=lambda row: (row["association_score"], row["confidence"], row["support"]),
                reverse=True,
            )[:top_k]

            results = []
            for item in ranked_rows:
                place_row = self.df[self.df["place_name"] == item["place_name"]]
                if place_row.empty:
                    continue
                payload = self._row_to_payload(place_row.iloc[0])
                payload.update(
                    {
                        "support": item["support"],
                        "confidence": item["confidence"],
                        "association_score": item["association_score"],
                    }
                )
                results.append(payload)

            return {
                "query": query,
                "type": "association_rules",
                "seed_destinations": seeds,
                "count": len(results),
                "results": results,
            }

        fallback_results = []
        if seeds:
            seed_row = self.df[self.df["place_name"] == seeds[0]]
            if not seed_row.empty:
                fallback_results = self._get_cluster_neighbors(
                    cluster_name=str(seed_row.iloc[0].get(CLUSTER_NAME_LABEL, "Budget travel")),
                    exclude_places=set(seeds),
                    region=str(seed_row.iloc[0].get("region", "Any")),
                    limit=top_k,
                )

        return {
            "query": query,
            "type": "cluster_fallback",
            "seed_destinations": seeds,
            "count": len(fallback_results),
            "results": fallback_results,
        }

    def get_user_recommendations(self, user_id: str, top_k: int = 10) -> dict:
        user_key = str(user_id or "").strip()
        if not user_key:
            raise ValueError("user_id is required")

        if not self.cf_model or user_key not in self.cf_user_index:
            fallback = self.get_trending_rankings(top_k=top_k)
            return {
                "user_id": user_key,
                "type": "fallback_trending",
                "recommendations": fallback["results"],
            }

        user_index = self.cf_user_index[user_key]
        scores = self.cf_model["reconstructed"][user_index]
        place_names = self.cf_model["place_names"]

        interacted = set()
        if self.cf_matrix is not None:
            user_interactions = self.cf_matrix.loc[user_key]
            interacted = set(user_interactions[user_interactions > 0].index.tolist())

        candidates = []
        for index, place_name in enumerate(place_names):
            if place_name in interacted:
                continue
            score = float(scores[index])
            place_row = self.df[self.df["place_name"] == place_name]
            if place_row.empty:
                continue
            payload = self._row_to_payload(place_row.iloc[0])
            payload["collaborative_score"] = round(score, 4)
            candidates.append(payload)

        candidates = sorted(candidates, key=lambda row: row.get("collaborative_score", 0), reverse=True)[:top_k]

        if not candidates:
            fallback = self.get_trending_rankings(top_k=top_k)
            return {
                "user_id": user_key,
                "type": "fallback_trending",
                "recommendations": fallback["results"],
            }

        return {
            "user_id": user_key,
            "type": "collaborative_filtering",
            "recommendations": candidates,
        }

    def _compute_search_click_metrics(self) -> pd.DataFrame:
        interactions = self._load_interactions()
        if interactions.empty:
            return pd.DataFrame(columns=["place_name", "clicks", "search_frequency"])

        metrics = []
        for _, interaction in interactions.iterrows():
            destination = self._resolve_destination_from_text(interaction.get("destination_name", ""))
            query_destination = self._resolve_destination_from_text(interaction.get("query", ""))
            resolved = destination or query_destination
            if not resolved:
                continue

            event = str(interaction.get("event_type", "")).lower()
            clicks = 1 if event in {"click", "tourism_click", "destination_click", "view", "view_place", "destination_view"} else 0
            searches = 1 if event in {"search", "semantic_search", "suggestion_select"} else 0
            metrics.append({"place_name": resolved, "clicks": clicks, "search_frequency": searches})

        if not metrics:
            return pd.DataFrame(columns=["place_name", "clicks", "search_frequency"])

        metrics_df = pd.DataFrame(metrics)
        return metrics_df.groupby("place_name", as_index=False).sum()

    def _compute_trending_ranking_dataframe(self) -> pd.DataFrame:
        ranking_df = self.df.copy()
        interaction_metrics = self._compute_search_click_metrics()
        ranking_df = ranking_df.merge(interaction_metrics, on="place_name", how="left")
        ranking_df["clicks"] = ranking_df["clicks"].fillna(0)
        ranking_df["search_frequency"] = ranking_df["search_frequency"].fillna(0)

        rating_norm = min_max_normalize(ranking_df["rating"])
        clicks_norm = min_max_normalize(ranking_df["clicks"])
        search_norm = min_max_normalize(ranking_df["search_frequency"])
        popularity_norm = min_max_normalize(ranking_df["popularity_score"])

        ranking_df["trending_score"] = (
            TRENDING_WEIGHTS["rating"] * rating_norm
            + TRENDING_WEIGHTS["clicks"] * clicks_norm
            + TRENDING_WEIGHTS["search_frequency"] * search_norm
            + TRENDING_WEIGHTS["popularity_score"] * popularity_norm
        )

        ranking_df = ranking_df.sort_values("trending_score", ascending=False)
        ranking_df["rank"] = range(1, len(ranking_df) + 1)
        return ranking_df

    def update_trending_rankings_daily(self, force: bool = False) -> dict:
        today = datetime.utcnow().date().isoformat()

        if self.trending_cache_path.exists() and not force:
            try:
                cached = json.loads(self.trending_cache_path.read_text(encoding="utf-8"))
                if cached.get("updated_on") == today:
                    return cached
            except Exception:
                pass

        ranking_df = self._compute_trending_ranking_dataframe()
        payload = {
            "updated_on": today,
            "weights": TRENDING_WEIGHTS,
            "results": [
                {
                    **self._row_to_payload(row),
                    "rank": int(row["rank"]),
                    "clicks": int(row.get("clicks", 0)),
                    "search_frequency": int(row.get("search_frequency", 0)),
                    "trending_score": round(float(row.get("trending_score", 0.0)), 4),
                }
                for _, row in ranking_df.iterrows()
            ],
        }
        self.trending_cache_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        return payload

    def get_trending_rankings(self, top_k: int = 12, force_refresh: bool = False) -> dict:
        payload = self.update_trending_rankings_daily(force=force_refresh)
        return {
            "updated_on": payload.get("updated_on"),
            "weights": payload.get("weights", TRENDING_WEIGHTS),
            "count": min(top_k, len(payload.get("results", []))),
            "results": payload.get("results", [])[:top_k],
        }

    def _load_cnn_model(self) -> None:
        if self.cnn_model is not None:
            return

        import torch
        from torchvision import models, transforms

        weights = models.ResNet50_Weights.DEFAULT
        model = models.resnet50(weights=weights)
        model.eval()

        self.cnn_model = model
        self.cnn_transform = weights.transforms()
        self.cnn_device = "cpu"
        self.cnn_imagenet_labels = list(weights.meta.get("categories", []))

    def _map_imagenet_to_destination_category(self, labels: list[str]) -> tuple[str, float]:
        if not labels:
            return "forest", 0.0

        mapped = [normalize_image_category(label) for label in labels]
        counts = pd.Series(mapped).value_counts()
        category = str(counts.index[0])
        confidence = float(counts.iloc[0] / len(labels))
        return category, confidence

    def classify_destination_image(self, image_path: Path) -> dict:
        self._load_cnn_model()

        import torch
        from PIL import Image

        image = Image.open(image_path).convert("RGB")
        tensor = self.cnn_transform(image).unsqueeze(0)

        with torch.no_grad():
            outputs = self.cnn_model(tensor)
            probabilities = torch.nn.functional.softmax(outputs[0], dim=0)
            top_probabilities, top_indices = torch.topk(probabilities, k=5)

        top_predictions = []
        for index_tensor, probability_tensor in zip(top_indices, top_probabilities):
            index = int(index_tensor.item())
            label = (
                self.cnn_imagenet_labels[index]
                if 0 <= index < len(self.cnn_imagenet_labels)
                else f"class_{index}"
            )
            top_predictions.append({
                "imagenet_label": label,
                "confidence": float(probability_tensor.item()),
            })

        mapped_category, mapped_confidence = self._map_imagenet_to_destination_category(
            [prediction["imagenet_label"] for prediction in top_predictions]
        )

        return {
            "image_path": str(image_path),
            "predicted_category": mapped_category,
            "mapping_confidence": round(mapped_confidence, 4),
            "top_predictions": top_predictions,
        }

    def auto_assign_image_categories(
        self,
        dataset_root: Path | None = None,
        limit: int = 200,
    ) -> dict:
        root = Path(dataset_root or self.default_image_dataset_root)
        if not root.exists():
            raise FileNotFoundError(f"Image dataset path not found: {root}")

        image_extensions = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
        image_files = [
            path for path in root.rglob("*")
            if path.is_file() and path.suffix.lower() in image_extensions
        ]

        image_files = image_files[: max(1, limit)]
        assignments = []

        for image_file in image_files:
            try:
                prediction = self.classify_destination_image(image_file)
                relative_parts = image_file.relative_to(root).parts
                folder_hint = relative_parts[0] if relative_parts else ""
                assignments.append(
                    {
                        "image_path": str(image_file),
                        "relative_path": str(image_file.relative_to(root)),
                        "folder_hint": folder_hint,
                        "predicted_category": prediction["predicted_category"],
                        "mapping_confidence": prediction["mapping_confidence"],
                        "top_predictions": prediction["top_predictions"],
                    }
                )
            except Exception as error:
                assignments.append(
                    {
                        "image_path": str(image_file),
                        "relative_path": str(image_file.relative_to(root)),
                        "folder_hint": "",
                        "predicted_category": "unknown",
                        "mapping_confidence": 0.0,
                        "error": str(error),
                    }
                )

        payload = {
            "updated_on": datetime.utcnow().isoformat(),
            "dataset_root": str(root),
            "count": len(assignments),
            "results": assignments,
        }

        self.image_assignment_json_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        pd.DataFrame(assignments).to_csv(self.image_assignment_csv_path, index=False)
        return payload

    def _prepare_hidden_gem_model(self) -> None:
        budget_low = self.df["budget"].quantile(0.20)
        budget_high = self.df["budget"].quantile(0.80)

        moderate_budget_score = 1 - (
            (self.df["budget"] - self.df["budget"].median()).abs() /
            max(self.df["budget"].max() - self.df["budget"].min(), 1)
        )
        rating_component = self.df["rating"] / max(self.df["rating"].max(), 1)
        popularity_component = 1 - (self.df["popularity_score"] / max(self.df["popularity_score"].max(), 1))

        self.df["hidden_gem_score"] = (
            0.5 * rating_component +
            0.35 * popularity_component +
            0.15 * moderate_budget_score
        ).round(4)

        self.df[HIDDEN_GEM_LABEL] = (
            (self.df["rating"] > 4.5) &
            (self.df["popularity_score"] < 60) &
            (self.df["budget"].between(budget_low, budget_high))
        ).astype(int)

        self.hidden_gem_pipeline.fit(self.df[FEATURE_COLUMNS], self.df[HIDDEN_GEM_LABEL])
        probabilities = self.hidden_gem_pipeline.predict_proba(self.df[FEATURE_COLUMNS])
        classes = list(self.hidden_gem_pipeline.named_steps["classifier"].classes_)

        if 1 in classes:
            positive_index = classes.index(1)
            self.df["hidden_gem_probability"] = probabilities[:, positive_index]
        else:
            # If only one class exists in data, fallback to normalized score for confidence display.
            score_min = self.df["hidden_gem_score"].min()
            score_max = self.df["hidden_gem_score"].max()
            if score_max == score_min:
                self.df["hidden_gem_probability"] = 0.0
            else:
                self.df["hidden_gem_probability"] = (
                    (self.df["hidden_gem_score"] - score_min) / (score_max - score_min)
                )

    def _prepare_category_classifier(self) -> None:
        self.df[MODEL_CATEGORY_LABEL] = self.df.apply(
            lambda row: normalize_category_label(row["category"], row["semantic_text"]),
            axis=1,
        )

        self.category_classifier.fit(self.df["semantic_text"], self.df[MODEL_CATEGORY_LABEL])
        self.df["predicted_category"] = self.category_classifier.predict(self.df["semantic_text"])

        if hasattr(self.category_classifier.named_steps["classifier"], "predict_proba"):
            probabilities = self.category_classifier.predict_proba(self.df["semantic_text"])
            self.df["category_confidence"] = probabilities.max(axis=1)
        else:
            self.df["category_confidence"] = 1.0

    def _prepare_clusters(self) -> None:
        cluster_features = self.df[["budget", "rating", "popularity_score", "region"]].copy()
        transformed = self.cluster_preprocessor.fit_transform(cluster_features)
        cluster_ids = self.cluster_model.fit_predict(transformed)
        self.df[CLUSTER_ID_LABEL] = cluster_ids

        cluster_summary = (
            self.df.groupby(CLUSTER_ID_LABEL)
            .agg(
                mean_budget=("budget", "mean"),
                mean_rating=("rating", "mean"),
                mean_popularity=("popularity_score", "mean"),
                hidden_gem_ratio=(HIDDEN_GEM_LABEL, "mean"),
                adventure_ratio=(MODEL_CATEGORY_LABEL, lambda x: (x == "Adventure").mean()),
                hill_ratio=(MODEL_CATEGORY_LABEL, lambda x: (x == "Hill Station").mean()),
            )
            .reset_index()
        )

        ordered_by_budget = cluster_summary.sort_values("mean_budget")
        budget_cluster = int(ordered_by_budget.iloc[0][CLUSTER_ID_LABEL])
        luxury_cluster = int(ordered_by_budget.iloc[-1][CLUSTER_ID_LABEL])

        remaining = cluster_summary[
            ~cluster_summary[CLUSTER_ID_LABEL].isin([budget_cluster, luxury_cluster])
        ].copy()

        if remaining.empty:
            cluster_name_map = {
                budget_cluster: "Budget travel",
                luxury_cluster: "Luxury travel",
            }
        else:
            hidden_cluster = int(remaining.sort_values("hidden_gem_ratio", ascending=False).iloc[0][CLUSTER_ID_LABEL])
            remaining_after_hidden = remaining[remaining[CLUSTER_ID_LABEL] != hidden_cluster]

            if remaining_after_hidden.empty:
                adventure_cluster = hidden_cluster
            else:
                adventure_cluster = int(
                    remaining_after_hidden
                    .assign(adventure_score=lambda frame: frame["adventure_ratio"] + frame["hill_ratio"])
                    .sort_values("adventure_score", ascending=False)
                    .iloc[0][CLUSTER_ID_LABEL]
                )

            cluster_name_map = {
                budget_cluster: "Budget travel",
                luxury_cluster: "Luxury travel",
                hidden_cluster: "Hidden gems",
                adventure_cluster: "Adventure travel",
            }

        for cluster_id in cluster_summary[CLUSTER_ID_LABEL].tolist():
            cluster_name_map.setdefault(int(cluster_id), "Budget travel")

        self.df[CLUSTER_NAME_LABEL] = self.df[CLUSTER_ID_LABEL].map(cluster_name_map)

    def _row_to_payload(self, row: pd.Series) -> dict:
        return {
            "place_name": row["place_name"],
            "state": row["state"],
            "region": row["region"],
            "category": row["category"],
            "rating": float(row["rating"]),
            "popularity_score": float(row["popularity_score"]),
            "budget": float(row["budget"]),
            "best_season": row["best_season"],
            "description": row["semantic_text"],
            "predicted_category": row.get("predicted_category", row.get(MODEL_CATEGORY_LABEL, "Garden")),
            "category_confidence": float(row.get("category_confidence", 0.0)),
            "hidden_gem_score": float(row.get("hidden_gem_score", 0.0)),
            "hidden_gem_probability": float(row.get("hidden_gem_probability", 0.0)),
            "is_hidden_gem": bool(row.get(HIDDEN_GEM_LABEL, 0)),
            "cluster_id": int(row.get(CLUSTER_ID_LABEL, -1)),
            "cluster_name": row.get(CLUSTER_NAME_LABEL, "Budget travel"),
        }

    def find_destination_index(self, query: str, require_strict: bool = False) -> int | None:
        normalized_query = query.strip().lower()
        if not normalized_query:
            return None

        exact = self.df.index[self.df["place_name"].str.lower() == normalized_query].tolist()
        if exact:
            return exact[0]

        partial = self.df.index[self.df["place_name"].str.lower().str.contains(normalized_query, na=False)].tolist()
        if partial:
            return partial[0]

        reverse_partial = self.df.index[
            self.df["place_name"].str.lower().apply(lambda name: normalized_query in name or name in normalized_query)
        ].tolist()
        if reverse_partial:
            return reverse_partial[0]

        all_names = self.df["place_name"].astype(str).tolist()
        cutoff = 0.72 if require_strict else 0.55
        close_matches = get_close_matches(query.strip(), all_names, n=1, cutoff=cutoff)
        if close_matches:
            close_match = close_matches[0].strip().lower()
            close_index = self.df.index[self.df["place_name"].str.lower() == close_match].tolist()
            if close_index:
                return close_index[0]

        if require_strict:
            return None

        try:
            query_embedding = self.embedding_model.encode([query], normalize_embeddings=True, show_progress_bar=False)
            similarities = cosine_similarity(query_embedding, self.embeddings)[0]
            best_index = int(similarities.argmax())
            best_score = float(similarities[best_index])
            if best_score >= 0.28:
                return best_index
        except Exception:
            pass

        return None

    def recommend(self, query: str, top_k: int = 5) -> dict:
        place_index = self.find_destination_index(query)
        if place_index is None:
            semantic_payload = self.semantic_search(query=query, top_k=top_k)
            if semantic_payload.get("results"):
                matched_destination = semantic_payload["results"][0]
                similar_payload = self.similar_destinations(
                    category=matched_destination.get("category"),
                    region=matched_destination.get("region"),
                    rating=matched_destination.get("rating"),
                    budget=matched_destination.get("budget"),
                    top_k=top_k,
                )
                return {
                    "query": query,
                    "matched_destination": matched_destination,
                    "recommendations": similar_payload.get("results", []),
                }
            raise LookupError(f"Destination '{query}' not found")

        distances, indices = self.knn_pipeline.named_steps["knn"].kneighbors(
            self.transformed_features[place_index:place_index + 1],
            n_neighbors=min(top_k + 1, len(self.df)),
        )

        recommendations = []
        for distance, index in zip(distances[0], indices[0]):
            if index == place_index:
                continue

            payload = self._row_to_payload(self.df.iloc[index])
            payload["similarity"] = round(1 - float(distance), 4)
            recommendations.append(payload)

            if len(recommendations) >= top_k:
                break

        return {
            "query": query,
            "matched_destination": self._row_to_payload(self.df.iloc[place_index]),
            "recommendations": recommendations,
        }

    def semantic_search(self, query: str, top_k: int = 10, region: str | None = None) -> dict:
        query_embedding = self.embedding_model.encode([query], normalize_embeddings=True, show_progress_bar=False)
        similarities = cosine_similarity(query_embedding, self.embeddings)[0]

        ranked = self.df.copy()
        ranked["semantic_similarity"] = similarities

        if region and region != "Any":
            ranked = ranked[ranked["region"].str.lower() == region.strip().lower()]

        ranked = ranked.sort_values("semantic_similarity", ascending=False).head(top_k)
        results = []
        for _, row in ranked.iterrows():
            payload = self._row_to_payload(row)
            payload["semantic_similarity"] = round(float(row["semantic_similarity"]), 4)
            results.append(payload)

        return {
            "query": query,
            "count": len(results),
            "results": results,
        }

    def get_hidden_gems(self, top_k: int = 6, region: str | None = None) -> dict:
        ranked = self.df.copy()
        if region and region != "Any":
            ranked = ranked[ranked["region"].str.lower() == region.strip().lower()]

        ranked = ranked[ranked[HIDDEN_GEM_LABEL] == 1]

        ranked = ranked.sort_values(
            ["hidden_gem_probability", "hidden_gem_score", "rating"],
            ascending=False,
        ).head(top_k)

        gems = [self._row_to_payload(row) for _, row in ranked.iterrows()]
        return {
            "count": len(gems),
            "results": gems,
        }

    def predict_category(self, description: str) -> dict:
        if not description.strip():
            raise ValueError("Description is required")

        predicted = self.category_classifier.predict([description])[0]
        confidence = 1.0
        top_candidates = []

        classifier = self.category_classifier.named_steps["classifier"]
        if hasattr(classifier, "predict_proba"):
            probabilities = self.category_classifier.predict_proba([description])[0]
            confidence = float(probabilities.max())
            sorted_indices = probabilities.argsort()[::-1][:3]
            classes = classifier.classes_
            top_candidates = [
                {
                    "category": str(classes[index]),
                    "confidence": round(float(probabilities[index]), 4),
                }
                for index in sorted_indices
            ]

        return {
            "description": description,
            "predicted_category": str(predicted),
            "confidence": round(confidence, 4),
            "top_candidates": top_candidates,
        }

    def get_clusters(self, region: str | None = None, limit_per_cluster: int = 6) -> dict:
        data = self.df.copy()
        if region and region != "Any":
            data = data[data["region"].str.lower() == region.strip().lower()]

        clusters = []
        for cluster_name in CLUSTER_DISPLAY_ORDER:
            cluster_rows = data[data[CLUSTER_NAME_LABEL] == cluster_name].copy()
            if cluster_rows.empty:
                continue

            sorted_rows = cluster_rows.sort_values(
                ["hidden_gem_probability", "rating", "popularity_score"],
                ascending=[False, False, True],
            ).head(limit_per_cluster)

            clusters.append(
                {
                    "cluster_name": cluster_name,
                    "count": int(cluster_rows.shape[0]),
                    "avg_budget": round(float(cluster_rows["budget"].mean()), 2),
                    "avg_rating": round(float(cluster_rows["rating"].mean()), 2),
                    "avg_popularity": round(float(cluster_rows["popularity_score"].mean()), 2),
                    "destinations": [self._row_to_payload(row) for _, row in sorted_rows.iterrows()],
                }
            )

        return {
            "count": len(clusters),
            "clusters": clusters,
        }


recommender: DestinationRecommender | None = None


def create_app() -> Flask:
    app = Flask(__name__)
    dataset_path = os.getenv("TOURISM_DATASET_PATH", str(DEFAULT_DATASET_PATH))

    global recommender
    recommender = DestinationRecommender(dataset_path)

    @app.after_request
    def add_cors_headers(response):
        response.headers["Access-Control-Allow-Origin"] = request.headers.get("Origin", "*")
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        return response

    @app.route("/health", methods=["GET"])
    def health_check():
        return jsonify(
            {
                "status": "ok",
                "dataset_path": str(recommender.dataset_path),
                "destinations": len(recommender.df),
                "embedding_model": DEFAULT_EMBEDDING_MODEL,
            }
        )

    @app.route("/recommendations", methods=["GET", "OPTIONS"])
    def get_recommendations():
        if request.method == "OPTIONS":
            return ("", 204)

        query = request.args.get("destination", "").strip()
        top_k = max(1, min(int(request.args.get("limit", 5)), 10))

        if not query:
            return jsonify({"success": False, "message": "Query parameter 'destination' is required"}), 400

        try:
            payload = recommender.recommend(query=query, top_k=top_k)
            return jsonify({"success": True, **payload})
        except LookupError as error:
            return jsonify({"success": False, "message": str(error)}), 404
        except Exception as error:
            return jsonify({"success": False, "message": str(error)}), 500

    @app.route("/similar-destinations", methods=["GET", "OPTIONS"])
    def get_similar_destinations():
        if request.method == "OPTIONS":
            return ("", 204)

        destination = request.args.get("destination", "").strip() or None
        category = request.args.get("category", "").strip() or None
        region = request.args.get("region", "").strip() or None

        rating_raw = request.args.get("rating", "").strip()
        budget_raw = request.args.get("budget", "").strip()
        min_similarity_raw = request.args.get("min_similarity", "").strip()
        rating = float(rating_raw) if rating_raw else None
        budget = float(budget_raw) if budget_raw else None
        min_similarity = float(min_similarity_raw) if min_similarity_raw else 0.45
        min_similarity = max(0.0, min(min_similarity, 1.0))
        top_k = max(1, min(int(request.args.get("limit", 8)), 20))

        try:
            payload = recommender.similar_destinations(
                destination=destination,
                category=category,
                region=region,
                rating=rating,
                budget=budget,
                top_k=top_k,
                min_similarity=min_similarity,
            )
            return jsonify({"success": True, **payload})
        except (LookupError, ValueError) as error:
            return jsonify({"success": False, "message": str(error)}), 400
        except Exception as error:
            return jsonify({"success": False, "message": str(error)}), 500

    @app.route("/semantic-search", methods=["GET", "OPTIONS"])
    def get_semantic_search():
        if request.method == "OPTIONS":
            return ("", 204)

        query = request.args.get("query", "").strip()
        region = request.args.get("region", "").strip() or None
        top_k = max(1, min(int(request.args.get("limit", 10)), 20))

        if not query:
            return jsonify({"success": False, "message": "Query parameter 'query' is required"}), 400

        try:
            payload = recommender.semantic_search(query=query, top_k=top_k, region=region)
            return jsonify({"success": True, **payload})
        except Exception as error:
            return jsonify({"success": False, "message": str(error)}), 500

    @app.route("/hidden-gems", methods=["GET", "OPTIONS"])
    def get_hidden_gems():
        if request.method == "OPTIONS":
            return ("", 204)

        region = request.args.get("region", "").strip() or None
        top_k = max(1, min(int(request.args.get("limit", 6)), 20))

        try:
            payload = recommender.get_hidden_gems(top_k=top_k, region=region)
            return jsonify({"success": True, **payload})
        except Exception as error:
            return jsonify({"success": False, "message": str(error)}), 500

    @app.route("/trending-rankings", methods=["GET", "OPTIONS"])
    def trending_rankings():
        if request.method == "OPTIONS":
            return ("", 204)

        top_k = max(1, min(int(request.args.get("limit", 12)), 50))
        refresh = request.args.get("refresh", "false").lower() in {"1", "true", "yes"}

        try:
            payload = recommender.get_trending_rankings(top_k=top_k, force_refresh=refresh)
            return jsonify({"success": True, **payload})
        except Exception as error:
            return jsonify({"success": False, "message": str(error)}), 500

    @app.route("/interaction-track", methods=["POST", "OPTIONS"])
    def interaction_track():
        if request.method == "OPTIONS":
            return ("", 204)

        data = request.get_json(silent=True) or {}
        user_id = str(data.get("user_id", "")).strip()
        event_type = str(data.get("event_type", "")).strip()
        query = str(data.get("query", "")).strip()
        destination_name = str(data.get("destination_name", "")).strip()
        category = str(data.get("category", "")).strip()

        if not user_id or not event_type:
            return jsonify({"success": False, "message": "user_id and event_type are required"}), 400

        try:
            recommender.track_interaction(
                user_id=user_id,
                event_type=event_type,
                query=query,
                destination_name=destination_name,
                category=category,
            )
            return jsonify({"success": True})
        except Exception as error:
            return jsonify({"success": False, "message": str(error)}), 500

    @app.route("/user-recommendations", methods=["GET", "OPTIONS"])
    def user_recommendations():
        if request.method == "OPTIONS":
            return ("", 204)

        user_id = request.args.get("user_id", "").strip()
        top_k = max(1, min(int(request.args.get("limit", 10)), 30))

        if not user_id:
            return jsonify({"success": False, "message": "Query parameter 'user_id' is required"}), 400

        try:
            payload = recommender.get_user_recommendations(user_id=user_id, top_k=top_k)
            return jsonify({"success": True, **payload})
        except Exception as error:
            return jsonify({"success": False, "message": str(error)}), 500

    @app.route("/travel-planner", methods=["POST", "OPTIONS"])
    def travel_planner():
        if request.method == "OPTIONS":
            return ("", 204)

        data = request.get_json(silent=True) or {}
        budget_raw = data.get("budget", 0)
        days_raw = data.get("number_of_days", 0)
        preferred_category = str(data.get("preferred_category", "Any")).strip() or "Any"
        region = str(data.get("region", "Any")).strip() or "Any"

        try:
            budget = float(budget_raw)
            days = int(days_raw)
            if budget <= 0 or days <= 0:
                raise ValueError("budget and number_of_days must be positive")
            payload = recommender.create_itinerary(
                budget=budget,
                number_of_days=days,
                preferred_category=preferred_category,
                region=region,
            )
            return jsonify({"success": True, **payload})
        except ValueError as error:
            return jsonify({"success": False, "message": str(error)}), 400
        except Exception as error:
            return jsonify({"success": False, "message": str(error)}), 500

    @app.route("/chatbot/assistant", methods=["POST", "OPTIONS"])
    def chatbot_assistant():
        if request.method == "OPTIONS":
            return ("", 204)

        data = request.get_json(silent=True) or {}
        message = str(data.get("message", "")).strip()
        session_id = str(data.get("sessionId", "default")).strip() or "default"

        if not message:
            return jsonify({"success": False, "message": "Field 'message' is required"}), 400

        try:
            payload = recommender.chatbot_assistant(message=message, session_id=session_id)
            return jsonify({"success": True, **payload})
        except Exception as error:
            return jsonify({"success": False, "message": str(error)}), 500

    @app.route("/category-predict", methods=["POST", "OPTIONS"])
    def category_predict():
        if request.method == "OPTIONS":
            return ("", 204)

        data = request.get_json(silent=True) or {}
        description = str(data.get("description", "")).strip()

        if not description:
            return jsonify({"success": False, "message": "Field 'description' is required"}), 400

        try:
            payload = recommender.predict_category(description)
            return jsonify({"success": True, **payload})
        except Exception as error:
            return jsonify({"success": False, "message": str(error)}), 500

    @app.route("/clusters", methods=["GET", "OPTIONS"])
    def clusters():
        if request.method == "OPTIONS":
            return ("", 204)

        region = request.args.get("region", "").strip() or None
        limit_per_cluster = max(1, min(int(request.args.get("limit", 6)), 20))

        try:
            payload = recommender.get_clusters(region=region, limit_per_cluster=limit_per_cluster)
            return jsonify({"success": True, **payload})
        except Exception as error:
            return jsonify({"success": False, "message": str(error)}), 500

    @app.route("/image-categories/assign", methods=["POST", "OPTIONS"])
    def image_categories_assign():
        if request.method == "OPTIONS":
            return ("", 204)

        data = request.get_json(silent=True) or {}
        dataset_root = data.get("dataset_root")
        limit = max(1, min(int(data.get("limit", 200)), 2000))

        try:
            payload = recommender.auto_assign_image_categories(
                dataset_root=Path(dataset_root) if dataset_root else None,
                limit=limit,
            )
            return jsonify({"success": True, **payload})
        except Exception as error:
            return jsonify({"success": False, "message": str(error)}), 500

    return app


app = create_app()


if __name__ == "__main__":
    runtime_port = int(os.getenv("PORT") or os.getenv("FLASK_PORT") or 5001)
    app.run(host="0.0.0.0", port=runtime_port, debug=False)
