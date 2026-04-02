import json

# Load and iterate hidden_places_states.json
with open('dataset/hidden_places_states.json', 'r', encoding='utf-8') as f:
    states_data = json.load(f)

print('Sample from states:')
for place in states_data[:5]:  # Show first 5 as a sample
    print(place['name'])

# Load and iterate hidden_places_territories.json
with open('dataset/hidden_places_territories.json', 'r', encoding='utf-8') as f:
    territories_data = json.load(f)

print('\nSample from territories:')
for place in territories_data[:5]:  # Show first 5 as a sample
    print(place['name'])
