const fs = require('fs');
const path = require('path');

const DATASET_PATH = path.join(__dirname, '../data/chatbot_dataset.json');
const REPORT_PATH = path.join(__dirname, '../data/chatbot_evaluation_report.json');

const SYNONYM_MAP = {
  accommodation: 'stay',
  accommodations: 'stay',
  stays: 'stay',
  hotel: 'stay',
  hotels: 'stay',
  booking: 'book',
  reservation: 'book',
  reservations: 'book',
  beaches: 'beach',
  mountains: 'mountain',
  temples: 'temple',
  destinations: 'destination',
  traveling: 'travel',
  travelling: 'travel',
  costs: 'cost',
  prices: 'price',
  support: 'help',
};

const normalizeToken = (token) => {
  let value = String(token || '').trim().toLowerCase();
  if (!value) {
    return '';
  }

  if (value.endsWith('ing') && value.length > 5) {
    value = value.slice(0, -3);
  } else if (value.endsWith('ed') && value.length > 4) {
    value = value.slice(0, -2);
  } else if (value.endsWith('s') && value.length > 3) {
    value = value.slice(0, -1);
  }

  return SYNONYM_MAP[value] || value;
};

const tokenize = (text) =>
  String(text || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .map(normalizeToken)
    .filter((word) => word.length > 2);

const jaccardSimilarity = (tokens1, tokens2) => {
  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);

  if (!set1.size || !set2.size) {
    return 0;
  }

  const intersection = [...set1].filter((token) => set2.has(token)).length;
  const union = new Set([...set1, ...set2]).size;
  return intersection / union;
};

const normalizeIntent = (intent) => {
  const tag = intent.tag || intent.category || 'general';
  const patterns = Array.isArray(intent.patterns)
    ? intent.patterns
    : Array.isArray(intent.questions)
      ? intent.questions
      : [];
  const keywords = Array.isArray(intent.keywords) ? intent.keywords : [];

  return {
    tag,
    patterns,
    keywords,
  };
};

const stratifiedSplit = (intents, testRatio = 0.2) => {
  const trainSamples = [];
  const testSamples = [];

  intents.forEach((intent) => {
    const cleanedPatterns = intent.patterns
      .map((pattern) => String(pattern || '').trim())
      .filter(Boolean);

    if (!cleanedPatterns.length) {
      return;
    }

    const testCount = Math.max(1, Math.round(cleanedPatterns.length * testRatio));
    const shuffled = [...cleanedPatterns].sort((a, b) => a.localeCompare(b));

    shuffled.forEach((pattern, index) => {
      const sample = {
        text: pattern,
        tag: intent.tag,
        keywords: intent.keywords,
      };

      if (index < testCount) {
        testSamples.push(sample);
      } else {
        trainSamples.push(sample);
      }
    });

    // Ensure every intent contributes to train set.
    if (!trainSamples.some((sample) => sample.tag === intent.tag)) {
      const promoted = testSamples.find((sample) => sample.tag === intent.tag);
      if (promoted) {
        trainSamples.push(promoted);
        const promotedIndex = testSamples.indexOf(promoted);
        testSamples.splice(promotedIndex, 1);
      }
    }
  });

  return { trainSamples, testSamples };
};

const frequencyMap = (tokens = []) => {
  const freq = new Map();
  tokens.forEach((token) => {
    freq.set(token, (freq.get(token) || 0) + 1);
  });
  return freq;
};

const vectorNorm = (freqMap) => {
  let sum = 0;
  freqMap.forEach((value) => {
    sum += value * value;
  });
  return Math.sqrt(sum);
};

const weightedCosineSimilarity = (inputFreq, inputNorm, profileFreq, profileNorm) => {
  if (!inputNorm || !profileNorm) {
    return 0;
  }

  let dot = 0;
  inputFreq.forEach((value, token) => {
    if (profileFreq.has(token)) {
      dot += value * profileFreq.get(token);
    }
  });

  return dot / (inputNorm * profileNorm);
};

const computeClassWeights = (trainSamples) => {
  const counts = {};
  trainSamples.forEach((sample) => {
    counts[sample.tag] = (counts[sample.tag] || 0) + 1;
  });

  const maxCount = Math.max(...Object.values(counts));
  const weights = {};

  Object.entries(counts).forEach(([tag, count]) => {
    // Intent balancing: lower-shot intents get slightly higher score weighting.
    weights[tag] = Number((maxCount / Math.max(count, 1)).toFixed(4));
  });

  return { counts, weights, maxCount };
};

const trainIntentModel = (trainSamples) => {
  const grouped = new Map();
  const { counts, weights } = computeClassWeights(trainSamples);

  trainSamples.forEach((sample) => {
    const existing = grouped.get(sample.tag) || {
      tag: sample.tag,
      tokenBank: [],
      keywordSet: new Set(),
    };

    const sampleTokens = tokenize(sample.text);
    const keywordTokens = tokenize(sample.keywords.join(' '));

    existing.tokenBank.push(...sampleTokens, ...keywordTokens, ...keywordTokens);
    keywordTokens.forEach((token) => existing.keywordSet.add(token));

    grouped.set(sample.tag, existing);
  });

  const profiles = [...grouped.values()].map((item) => {
    const tokens = tokenize(item.tokenBank.join(' '));
    const tokenFreq = frequencyMap(tokens);

    return {
      tag: item.tag,
      tokens,
      tokenFreq,
      tokenNorm: vectorNorm(tokenFreq),
      keywordSet: item.keywordSet,
      classWeight: weights[item.tag] || 1,
      sampleCount: counts[item.tag] || 0,
    };
  });

  return {
    profiles,
    classWeights: weights,
    classCounts: counts,
  };
};

const predictIntent = (text, trainedModel) => {
  const { profiles } = trainedModel;
  const inputTokens = tokenize(text);
  const inputFreq = frequencyMap(inputTokens);
  const inputNorm = vectorNorm(inputFreq);

  let bestTag = 'unknown';
  let bestScore = 0;
  let secondBestTag = 'unknown';
  let secondBestScore = 0;

  profiles.forEach((intent) => {
    const baseCosine = weightedCosineSimilarity(
      inputFreq,
      inputNorm,
      intent.tokenFreq,
      intent.tokenNorm
    );

    const overlapWithKeywords = inputTokens.filter((token) => intent.keywordSet.has(token)).length;
    const keywordBoost = 1 + overlapWithKeywords * 0.12;
    const classBalanceBoost = Math.pow(intent.classWeight || 1, 0.35);
    const jaccard = jaccardSimilarity(inputTokens, intent.tokens);

    const score = (0.7 * baseCosine + 0.3 * jaccard) * keywordBoost * classBalanceBoost;

    if (score > bestScore) {
      secondBestTag = bestTag;
      secondBestScore = bestScore;
      bestScore = score;
      bestTag = intent.tag;
    } else if (score > secondBestScore) {
      secondBestScore = score;
      secondBestTag = intent.tag;
    }
  });

  const confidenceMargin = bestScore - secondBestScore;
  const threshold = confidenceMargin < 0.03 ? 0.1 : 0.075;

  const predictedTag = bestScore > threshold ? bestTag : 'unknown';

  return {
    predictedTag,
    bestTag,
    secondBestTag,
    confidenceMargin: Number(confidenceMargin.toFixed(4)),
    score: Number(bestScore.toFixed(4)),
  };
};

const buildConfusionMatrix = (labels, predictions) => {
  const matrix = {};

  labels.forEach((expectedLabel) => {
    matrix[expectedLabel] = {};
    labels.forEach((predictedLabel) => {
      matrix[expectedLabel][predictedLabel] = 0;
    });
  });

  predictions.forEach((prediction) => {
    const expected = labels.includes(prediction.expectedTag) ? prediction.expectedTag : 'unknown';
    const predicted = labels.includes(prediction.predictedTag) ? prediction.predictedTag : 'unknown';
    matrix[expected][predicted] += 1;
  });

  return matrix;
};

const deriveMetrics = (labels, confusionMatrix, predictions, baseLabels) => {
  const metricsByLabel = labels.map((label) => {
    const truePositive = confusionMatrix[label][label] || 0;
    const falsePositive = labels
      .filter((other) => other !== label)
      .reduce((sum, other) => sum + (confusionMatrix[other][label] || 0), 0);

    const falseNegative = labels
      .filter((other) => other !== label)
      .reduce((sum, other) => sum + (confusionMatrix[label][other] || 0), 0);

    const precision = truePositive / Math.max(truePositive + falsePositive, 1);
    const recall = truePositive / Math.max(truePositive + falseNegative, 1);
    const f1 = (2 * precision * recall) / Math.max(precision + recall, Number.EPSILON);

    return {
      label,
      support: predictions.filter((item) => item.expectedTag === label).length,
      precision: Number(precision.toFixed(4)),
      recall: Number(recall.toFixed(4)),
      f1: Number(f1.toFixed(4)),
    };
  });

  const macroLabels = baseLabels;
  const macroF1 =
    macroLabels.reduce((sum, label) => {
      const metric = metricsByLabel.find((item) => item.label === label);
      return sum + (metric ? metric.f1 : 0);
    }, 0) / Math.max(macroLabels.length, 1);

  const totalSupport = macroLabels.reduce((sum, label) => {
    const metric = metricsByLabel.find((item) => item.label === label);
    return sum + (metric ? metric.support : 0);
  }, 0);

  const weightedF1 =
    macroLabels.reduce((sum, label) => {
      const metric = metricsByLabel.find((item) => item.label === label);
      if (!metric || !totalSupport) {
        return sum;
      }
      return sum + metric.f1 * (metric.support / totalSupport);
    }, 0);

  return {
    byLabel: metricsByLabel,
    macroF1: Number(macroF1.toFixed(4)),
    weightedF1: Number(weightedF1.toFixed(4)),
  };
};

const topConfusions = (labels, confusionMatrix, limit = 8) => {
  const items = [];

  labels.forEach((expected) => {
    labels.forEach((predicted) => {
      if (expected === predicted) {
        return;
      }

      const count = confusionMatrix[expected][predicted] || 0;
      if (count > 0) {
        items.push({ expected, predicted, count });
      }
    });
  });

  return items.sort((a, b) => b.count - a.count).slice(0, limit);
};

const evaluate = () => {
  if (!fs.existsSync(DATASET_PATH)) {
    throw new Error(`Chatbot dataset not found at: ${DATASET_PATH}`);
  }

  let previousAccuracy = null;
  if (fs.existsSync(REPORT_PATH)) {
    try {
      const previous = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));
      if (typeof previous.accuracy === 'number') {
        previousAccuracy = previous.accuracy;
      }
    } catch (error) {
      previousAccuracy = null;
    }
  }

  const raw = fs.readFileSync(DATASET_PATH, 'utf8');
  const parsed = JSON.parse(raw);
  const intentsRaw = Array.isArray(parsed) ? parsed : parsed.intents || [];

  const intents = intentsRaw.map(normalizeIntent).filter((intent) => intent.patterns.length);
  const intentLabels = [...new Set(intents.map((intent) => intent.tag))].sort();

  const { trainSamples, testSamples } = stratifiedSplit(intents, 0.2);
  const trainedModel = trainIntentModel(trainSamples);

  let correct = 0;
  const perIntent = {};

  const predictions = testSamples.map((sample) => {
    const result = predictIntent(sample.text, trainedModel);
    const isCorrect = result.predictedTag === sample.tag;

    if (isCorrect) {
      correct += 1;
    }

    if (!perIntent[sample.tag]) {
      perIntent[sample.tag] = { total: 0, correct: 0 };
    }

    perIntent[sample.tag].total += 1;
    if (isCorrect) {
      perIntent[sample.tag].correct += 1;
    }

    return {
      text: sample.text,
      expectedTag: sample.tag,
      predictedTag: result.predictedTag,
      score: result.score,
      confidenceMargin: result.confidenceMargin,
      secondBestTag: result.secondBestTag,
      correct: isCorrect,
    };
  });

  const accuracy = testSamples.length ? correct / testSamples.length : 0;
  const labelsForMatrix = [...intentLabels, 'unknown'];
  const confusionMatrix = buildConfusionMatrix(labelsForMatrix, predictions);
  const classificationMetrics = deriveMetrics(labelsForMatrix, confusionMatrix, predictions, intentLabels);
  const confusionPairs = topConfusions(labelsForMatrix, confusionMatrix, 10);

  const accuracyDelta =
    typeof previousAccuracy === 'number'
      ? Number((accuracy - previousAccuracy).toFixed(4))
      : null;

  const report = {
    generatedAt: new Date().toISOString(),
    datasetPath: DATASET_PATH,
    intentsCount: intents.length,
    trainSamples: trainSamples.length,
    testSamples: testSamples.length,
    accuracy: Number(accuracy.toFixed(4)),
    previousAccuracy,
    accuracyDelta,
    classBalance: {
      sampleCountByIntent: trainedModel.classCounts,
      classWeightByIntent: trainedModel.classWeights,
    },
    confusionMatrix,
    classificationMetrics,
    topConfusions: confusionPairs,
    perIntent: Object.entries(perIntent).map(([tag, stats]) => ({
      tag,
      total: stats.total,
      correct: stats.correct,
      accuracy: Number((stats.correct / Math.max(stats.total, 1)).toFixed(4)),
    })),
    predictions,
  };

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));

  console.log('✅ Chatbot train-test evaluation complete');
  console.log(`   Intents: ${report.intentsCount}`);
  console.log(`   Train samples: ${report.trainSamples}`);
  console.log(`   Test samples: ${report.testSamples}`);
  console.log(`   Accuracy: ${(report.accuracy * 100).toFixed(2)}%`);
  console.log(`   Macro F1: ${(report.classificationMetrics.macroF1 * 100).toFixed(2)}%`);
  console.log(`   Weighted F1: ${(report.classificationMetrics.weightedF1 * 100).toFixed(2)}%`);
  if (typeof report.accuracyDelta === 'number') {
    const sign = report.accuracyDelta >= 0 ? '+' : '';
    console.log(`   Accuracy delta vs previous: ${sign}${(report.accuracyDelta * 100).toFixed(2)}%`);
  }
  console.log(`   Report: ${REPORT_PATH}`);
};

evaluate();
