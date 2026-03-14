#!/usr/bin/env python3
"""
Split a full India offbeat tourism dataset into one JSON file per state/UT.

Features:
- Accepts JSON array OR NDJSON input
- Validates required offbeat schema fields
- Groups by state/UT and writes files to dataset/
- Sorts each state file by direction (north->south->east->west),
  then by popularity_score (descending)
- Handles common filename aliases (e.g., Puducherry -> pondicherry.json)
"""

from __future__ import annotations

import argparse
import json
import re
from collections import defaultdict
from pathlib import Path
from typing import Any, Dict, List, Tuple

REQUIRED_FIELDS = [
    "id",
    "name",
    "state",
    "district",
    "direction",
    "region_type",
    "tourism_type",
    "popularity",
    "popularity_score",
    "rating",
    "best_season",
    "budget_range",
    "activities",
    "activity_types",
    "crowd_level",
    "transport_access",
    "eco_score",
    "family_friendly",
    "coordinates",
    "images",
    "description",
]

DIRECTION_ORDER = {
    "north": 0,
    "south": 1,
    "east": 2,
    "west": 3,
}

STATE_FILE_ALIASES = {
    # User-requested naming example
    "puducherry": "pondicherry",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Split offbeat tourism data into per-state JSON files"
    )
    parser.add_argument(
        "input_file",
        help="Path to the main JSON input (array JSON or NDJSON)",
    )
    parser.add_argument(
        "--output-dir",
        default="dataset",
        help="Output directory for per-state JSON files (default: dataset)",
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Fail on first invalid record (default: skip invalid records and continue)",
    )
    return parser.parse_args()


def load_records(input_path: Path) -> List[Dict[str, Any]]:
    raw = input_path.read_text(encoding="utf-8").strip()
    if not raw:
        raise ValueError(f"Input file is empty: {input_path}")

    # Try standard JSON first
    try:
        parsed = json.loads(raw)
        if isinstance(parsed, list):
            return [r for r in parsed if isinstance(r, dict)]
        if isinstance(parsed, dict):
            # Support a wrapper shape like {"data": [...]} or {"places": [...]}
            for key in ("data", "places", "records"):
                maybe = parsed.get(key)
                if isinstance(maybe, list):
                    return [r for r in maybe if isinstance(r, dict)]
            raise ValueError(
                "Input JSON is an object but no array found under keys: data/places/records"
            )
    except json.JSONDecodeError:
        pass

    # Fallback: NDJSON
    records: List[Dict[str, Any]] = []
    for i, line in enumerate(raw.splitlines(), start=1):
        line = line.strip()
        if not line:
            continue
        try:
            row = json.loads(line)
        except json.JSONDecodeError as exc:
            raise ValueError(f"Invalid NDJSON at line {i}: {exc}") from exc
        if isinstance(row, dict):
            records.append(row)

    if not records:
        raise ValueError("No JSON objects could be read from input")
    return records


def normalize_filename(state: str) -> str:
    base = state.strip().lower()
    base = re.sub(r"[&/]+", " and ", base)
    base = re.sub(r"[^a-z0-9\s-]", "", base)
    base = re.sub(r"\s+", "-", base).strip("-")
    if not base:
        base = "unknown-state"
    base = STATE_FILE_ALIASES.get(base, base)
    return f"{base}.json"


def validate_record(record: Dict[str, Any]) -> Tuple[bool, str]:
    missing = [k for k in REQUIRED_FIELDS if k not in record]
    if missing:
        return False, f"missing fields: {', '.join(missing)}"

    state = str(record.get("state", "")).strip()
    if not state:
        return False, "missing/empty state"

    if not isinstance(record.get("best_season"), list):
        return False, "best_season must be a list"
    if not isinstance(record.get("activities"), list):
        return False, "activities must be a list"
    if not isinstance(record.get("activity_types"), list):
        return False, "activity_types must be a list"
    if not isinstance(record.get("images"), list):
        return False, "images must be a list"

    coords = record.get("coordinates")
    if not isinstance(coords, dict) or "lat" not in coords or "lng" not in coords:
        return False, "coordinates must be an object with lat and lng"

    return True, ""


def direction_rank(value: Any) -> int:
    key = str(value or "").strip().lower()
    return DIRECTION_ORDER.get(key, 99)


def popularity_score_value(value: Any) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return float("-inf")


def sort_records(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return sorted(
        records,
        key=lambda r: (
            direction_rank(r.get("direction")),
            -popularity_score_value(r.get("popularity_score")),
            str(r.get("name", "")).lower(),
        ),
    )


def project_required_fields(record: Dict[str, Any]) -> Dict[str, Any]:
    """Preserve only required API fields and keep their order."""
    return {field: record.get(field) for field in REQUIRED_FIELDS}


def split_and_write(records: List[Dict[str, Any]], output_dir: Path, strict: bool) -> None:
    grouped: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    invalid_count = 0

    for idx, rec in enumerate(records, start=1):
        ok, reason = validate_record(rec)
        if not ok:
            invalid_count += 1
            message = f"Record #{idx} skipped ({reason})"
            if strict:
                raise ValueError(message)
            print(f"[warn] {message}")
            continue

        state = str(rec["state"]).strip()
        grouped[state].append(project_required_fields(rec))

    if not grouped:
        raise ValueError(
            "No valid offbeat records found after validation. "
            "Check that your input uses the required schema fields."
        )

    output_dir.mkdir(parents=True, exist_ok=True)

    written_files = 0
    written_records = 0

    for state, state_records in sorted(grouped.items(), key=lambda x: x[0].lower()):
        filename = normalize_filename(state)
        out_path = output_dir / filename

        ordered = sort_records(state_records)
        out_path.write_text(
            json.dumps(ordered, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

        written_files += 1
        written_records += len(ordered)

    print(f"[ok] Wrote {written_files} state/UT files to: {output_dir.resolve()}")
    print(f"[ok] Total valid records written: {written_records}")
    if invalid_count:
        print(f"[warn] Invalid/skipped records: {invalid_count}")


def main() -> None:
    args = parse_args()
    input_path = Path(args.input_file)
    output_dir = Path(args.output_dir)

    if not input_path.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")

    records = load_records(input_path)
    split_and_write(records, output_dir, strict=args.strict)


if __name__ == "__main__":
    main()
