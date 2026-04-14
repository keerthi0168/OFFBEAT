# Algorithms and Recommendation Logic

This document summarizes the main algorithmic patterns currently used across the OTT Website.

## 1) Retrieval + ranking foundations

### TF-IDF style relevance and token matching

Used in tourism search/recommendation training scripts and text matching flows.

Core idea:

- term relevance increases with term frequency in a record
- term relevance decreases when the term appears in too many records

Reference formula:

$$
\mathrm{TF\mbox{-}IDF}(t,d) = \mathrm{TF}(t,d) \times \log\left(\frac{N+1}{df(t)+1}\right)
$$

### Cosine similarity for textual closeness

Used to compare user query vectors and destination vectors.

$$
\cos(\theta)=\frac{\mathbf{a}\cdot\mathbf{b}}{\|\mathbf{a}\|\|\mathbf{b}\|}
$$

Higher value means stronger match.

## 2) Hybrid scoring in travel planning fallback

The frontend planner fallback (`client/src/utils/mlApi.js`) computes weighted candidate scores combining:

- category preference match
- rating influence
- budget fit and overspend penalties
- route continuity across days (state/region proximity)
- diversity (avoid repeated destinations)

This makes itinerary generation usable even if the ML endpoint is unavailable.

## 3) Continuity-aware route quality

Region transitions are penalized when geographically less adjacent. The summary includes a `route_quality_score` derived from cumulative transition penalties.

## 4) Chatbot resilience algorithm

Chat flow is multi-stage:

1. Try ML assistant endpoint (`/chatbot/assistant`).
2. If confidence/quality is low or request fails, fallback to Node endpoint (`/chatbot/chat`).

This reduces chatbot downtime impact and keeps user responses available.

## 5) Deduplication and normalization patterns

Common practices in recommendation/search responses:

- normalize comparison keys (trim/lowercase)
- deduplicate result sets using set-based checks
- convert unsafe numeric input to bounded numeric defaults before scoring

## 6) Complexity snapshot (directional)

- Query-to-destination vector similarity: typically $O(k)$ per compared vector
- Candidate scoring in fallback planner: roughly $O(n \log n)$ because of scoring + sort
- Deduplication using hash sets: $O(n)$ average

Where:

- $n$ = number of candidate destinations
- $k$ = vector dimension/token space used for similarity

## 7) Practical notes

- Algorithms are tuned for responsiveness and graceful degradation.
- Hybrid/fallback logic prioritizes product continuity over strict ML dependency.
- Keep scoring constants in one place when future tuning is needed.
