import re
import json
import os


def extract_json_objects_from_lines(lines):
    objects = []
    buffer = ''
    brace_count = 0
    for line in lines:
        line = line.strip()
        if not line or line in ('[', ']', ','):
            continue
        # Accumulate lines for each object
        brace_count += line.count('{') - line.count('}')
        buffer += line
        if brace_count == 0 and buffer:
            try:
                obj = json.loads(buffer)
                objects.append(obj)
            except Exception:
                pass
            buffer = ''
    print(f"[repair] Found {len(objects)} JSON objects in input lines.")
    return objects

def repair_file_inplace(input_path):
    with open(input_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    objects = extract_json_objects_from_lines(lines)
    if objects:
        with open(input_path, 'w', encoding='utf-8') as f:
            json.dump(objects, f, ensure_ascii=False, indent=2)
        print(f"[repair] Overwrote {input_path} with {len(objects)} valid objects as JSON array.")
    else:
        print(f"[repair] No valid objects found in {input_path}. No changes made.")

# Main block at the very end, after all imports, variables, and function definitions
if __name__ == '__main__':
    print("[repair] Starting JSON repair script...")
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    states_path = os.path.join(base_dir, 'dataset', 'hidden_places_states.json')
    territories_path = os.path.join(base_dir, 'dataset', 'hidden_places_territories.json')
    repair_file_inplace(states_path)
    repair_file_inplace(territories_path)
