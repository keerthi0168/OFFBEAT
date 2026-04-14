import json
import os

# Paths to hidden places datasets
hidden_files = [
    'dataset/hidden_places_territories.json',
    'dataset/hidden_places_states.json'
]

# Paths to normal places datasets (add more if needed)
normal_files = [
    'api/data/indian_travel_dataset.json',
    'api/data/realTourismData.js',  # JS file, will handle separately
]

def load_json_file(path):
    # Handle NDJSON (JSON Lines) for indian_travel_dataset.json
    if os.path.basename(path) == 'indian_travel_dataset.json':
        data = []
        with open(path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line:
                    data.append(json.loads(line))
        return data
    else:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)

def load_js_json(path):
    # Assumes the JS file exports a variable with JSON data
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    # Find the first { and last } to extract JSON
    start = content.find('{')
    end = content.rfind('}') + 1
    json_str = content[start:end]
    try:
        return json.loads(json_str)
    except Exception as e:
        print(f"Error parsing JS file {path}: {e}")
        return []

def main():

    hidden_places = []
    for file in hidden_files:
        if os.path.exists(file):
            data = load_json_file(file)
            print(f"Loaded {len(data)} entries from {file}")
            hidden_places.extend(data)
        else:
            print(f"Hidden file not found: {file}")

    normal_places = []
    for file in normal_files:
        if os.path.exists(file):
            if file.endswith('.json'):
                normal_places.extend(load_json_file(file))
            elif file.endswith('.js'):
                data = load_js_json(file)
                if isinstance(data, list):
                    normal_places.extend(data)
                elif isinstance(data, dict):
                    normal_places.append(data)
        else:
            print(f"Normal file not found: {file}")

    print(f"Loaded {len(hidden_places)} hidden places.")
    print(f"Loaded {len(normal_places)} normal places.")
    print("Sample hidden place:", hidden_places[0] if hidden_places else None)
    print("Sample normal place:", normal_places[0] if normal_places else None)

if __name__ == "__main__":
    main()
