import json
from collections import OrderedDict
from pathlib import Path

def load_json(path):
    with open(path, encoding='utf-8') as f:
        try:
            data = json.load(f)
            if isinstance(data, dict):
                # Sometimes a dict with a single key (bad format)
                data = list(data.values())
            return data
        except Exception as e:
            print(f"Error loading {path}: {e}")
            return []

def deduplicate_places(places):
    seen = set()
    deduped = []
    for place in places:
        pid = place.get('id')
        if pid and pid not in seen:
            deduped.append(place)
            seen.add(pid)
    return deduped

def clean_and_save(input_path, output_path):
    data = load_json(input_path)
    if not isinstance(data, list):
        print(f"Warning: {input_path} is not a list!")
        return
    deduped = deduplicate_places(data)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(deduped, f, ensure_ascii=False, indent=2)
    print(f"Cleaned and saved: {output_path} ({len(deduped)} records)")

if __name__ == "__main__":
    base = Path(__file__).parent.parent / "dataset"
    clean_and_save(base / "hidden_places_states.json", base / "hidden_places_states.cleaned.json")
    clean_and_save(base / "hidden_places_territories.json", base / "hidden_places_territories.cleaned.json")
