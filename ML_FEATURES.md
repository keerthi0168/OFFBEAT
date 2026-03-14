# Machine Learning Features - Tourism Recommendation System

## Overview

The tourism recommendation system uses advanced ML techniques including:
- **Train/Test Split** (80/20) for model validation
- **Feature Scaling** (Min-Max Normalization)
- **TF-IDF Vectorization** for text features
- **Multi-feature Engineering** using all dataset fields
- **Hybrid Similarity** combining text and numeric features

## Dataset Fields Utilized

All fields from `indian_travel_dataset.json` are used:

### Text Features (TF-IDF)
- `Destination_Name` - Primary identifier
- `State` - Geographic location
- `Region` - North/South/East/West India
- `Category` - Beach/Heritage/Nature/Adventure/Religious
- `Popular_Attraction` - Key attractions
- `Accessibility` - Easy/Moderate/Difficult access
- `Nearest_Airport` - Airport connectivity
- `Nearest_Railway_Station` - Railway connectivity

### Numeric Features (Scaled)
1. **categoryScore** - Encoded category value (normalized 0-1)
2. **regionScore** - Encoded region value (normalized 0-1)
3. **stateScore** - Encoded state value (normalized 0-1)
4. **accessibilityScore** - Encoded accessibility level (normalized 0-1)
5. **hasAirport** - Binary (0/1) - Airport availability
6. **hasRailway** - Binary (0/1) - Railway availability
7. **attractionLength** - Normalized attraction description length
8. **nameLength** - Normalized destination name length

## Training Pipeline

### 1. Data Loading
```bash
npm run train:tourism:enhanced
```

Loads all destinations from `api/data/indian_travel_dataset.json`

### 2. Preprocessing
- Remove duplicates based on `Destination_Name`
- Build categorical encodings for:
  - Categories (Beach, Heritage, Nature, etc.)
  - Regions (North, South, East, West)
  - States (All Indian states)
  - Accessibility levels

### 3. Train/Test Split
- **Training Set**: 80% of data
- **Test Set**: 20% of data
- **Random Seed**: 42 (for reproducibility)
- **Method**: Seeded Fisher-Yates shuffle

### 4. Feature Extraction
- **Text Features**: Tokenization → TF-IDF weighting
- **Numeric Features**: 8 engineered features per destination

### 5. Feature Scaling
**Min-Max Normalization** applied to all numeric features:

```
scaled_value = (value - min) / (max - min)
```

Ensures all features are in [0, 1] range for fair comparison.

### 6. Model Building
- **Vocabulary**: All unique tokens across destinations
- **IDF Calculation**: Inverse document frequency for each term
- **Vector Representation**: Sparse vectors (TF-IDF weights)
- **Feature Vectors**: Dense 8-dimensional scaled features

### 7. Evaluation
- Average similarity scores on test set
- Coverage metrics
- Performance statistics

### 8. Model Export
Saves to `api/data/tourism_model_enhanced.json` with:
- Metadata (version, training date, statistics)
- IDF weights
- Categorical encodings
- Scaling parameters
- Feature vectors

## Model Usage

### Personalized Recommendations

The `/tourism/personalized` endpoint uses:

**Hybrid Similarity Score**:
```
combined_score = (text_similarity × 0.7) + (feature_similarity × 0.3)
```

**Text Similarity**: Cosine similarity of TF-IDF vectors
**Feature Similarity**: Inverse Euclidean distance of scaled features

### User Signals Integration

Recommendations consider:
- Search query text
- Preferred categories (from user history)
- Preferred regions (from user history)
- Additional search terms

## Training Output Example

```
🚀 Starting Enhanced Tourism Model Training...

📊 Loading dataset...
   ✓ Loaded 1247 destinations

   ✓ Unique destinations: 1247

🔢 Building categorical encodings...
   ✓ Categories: 5
   ✓ Regions: 4
   ✓ States: 35
   ✓ Accessibility levels: 3

✂️  Splitting data (80/20 train/test)...
   ✓ Training set: 997 destinations
   ✓ Test set: 250 destinations

🔧 Extracting numeric features...
   ✓ Feature dimensions: 8

📏 Calculating scaling parameters...
   ✓ Min-Max scaling parameters computed

🧠 Building TF-IDF model...
   ✓ Vocabulary size: 3421
   ✓ Vector dimensions: 997

⚖️  Applying feature scaling...
   ✓ Features scaled using min-max normalization

📈 Evaluating model on test set...
   ✓ Test set size: 250
   ✓ Avg similarity: 0.8743
   ✓ Coverage: 100.00%

💾 Saving enhanced model...
   ✓ Model saved to tourism_model_enhanced.json

✅ Training Complete!
```

## API Response Format

Personalized recommendations include scoring breakdown:

```json
{
  "query": "beach destinations",
  "count": 12,
  "results": [
    {
      "name": "Radhanagar Beach",
      "state": "Andaman and Nicobar Islands",
      "region": "South",
      "category": "Beach",
      "attraction": "Pristine white sand beach",
      "accessibility": "Easy",
      "airport": "Port Blair Airport",
      "railway": "None",
      "score": 0.9234,
      "textScore": 0.8821,
      "featureScore": 0.8145
    }
  ],
  "type": "personalized",
  "featuresUsed": true
}
```

## Feature Scaling Benefits

1. **Fair Comparison**: All features contribute equally
2. **Faster Convergence**: Normalized ranges improve computation
3. **Better Accuracy**: Prevents feature dominance
4. **Consistent Results**: Reproducible recommendations

## Model Versioning

- **Version 1.0**: Basic TF-IDF (trainTourismModel.js)
- **Version 2.0**: Enhanced with train/test split + feature scaling (trainEnhancedTourismModel.js)

The system automatically uses the enhanced model if available, falling back to basic model if not found.

## Performance Metrics

- **Training Time**: ~2-5 seconds for 1247 destinations
- **Model Size**: ~2-5 MB (compressed JSON)
- **Memory Usage**: ~50-100 MB (cached in-memory)
- **Response Time**: <100ms for personalized queries

## Best Practices

1. **Retrain periodically** when dataset is updated
2. **Monitor test scores** to detect data drift
3. **Version control** model files
4. **Cache in memory** for production performance
5. **Use all fields** to maximize recommendation quality

## Future Enhancements

- [ ] Deep learning embeddings (Word2Vec/BERT)
- [ ] User interaction tracking for collaborative filtering
- [ ] A/B testing framework for model comparison
- [ ] Real-time model updates
- [ ] Multi-language support
