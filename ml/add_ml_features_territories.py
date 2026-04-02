import json
from collections import defaultdict

# Load the dataset
with open('dataset/hidden_places_territories.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Build state encoding (for union territories, use 'state' field)
state_set = sorted(set(place['state'] for place in data))
state_encoding = {state: idx for idx, state in enumerate(state_set)}

# Build region_type one-hot encoding
region_types = sorted(set(place['region_type'] for place in data if 'region_type' in place))
region_type_encoding = {rt: idx for idx, rt in enumerate(region_types)}

for place in data:
    # ML features
    place['num_images'] = len(place.get('images', []))
    place['has_google_url'] = bool(place.get('google_url') or place.get('google_maps_url'))
    place['season_count'] = len(place.get('best_season', []))
    place['activity_count'] = len(place.get('activities', []))
    place['description_length'] = len(place.get('description', ''))
    place['state_encoded'] = state_encoding.get(place['state'], -1)
    place['region_type_onehot'] = [0]*len(region_types)
    if 'region_type' in place:
        idx = region_type_encoding[place['region_type']]
        place['region_type_onehot'][idx] = 1
    # Normalize popularity_score (assume 1-5 scale)
    pop_score = place.get('popularity_score', 0)
    place['popularity_score_norm'] = (pop_score - 1) / 4 if pop_score else 0

# Save back
with open('dataset/hidden_places_territories.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print('ML features added to hidden_places_territories.json')
