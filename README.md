# Offbeat Travel India (OTT Website)

A full-stack travel discovery platform focused on hidden gems and smart trip planning across India.

This repository includes:

- `client/` → React + Vite frontend
- `api/` → Node.js + Express backend
- `ml/` → Python ML service + utility scripts
- `dataset/` → curated tourism/offbeat datasets

---

## What users can do

1. Explore destinations with search and filters.
2. Get AI-assisted recommendations and similar places.
3. Use the chatbot and planner for travel ideas.
4. Manage auth/profile and booking flows.

---

## Tech stack

- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Node.js, Express
- **Persistence:** MongoDB + MySQL integrations
- **ML:** Python-based recommendation endpoints (`ml/tourism_knn_api.py`)

---

## Local setup

### 1) Backend (`api/.env`)

```env
NODE_ENV=development
PORT=8001
DB_URL=mongodb://127.0.0.1:27017/myownspace
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=myownspace
JWT_SECRET=replace_with_secure_value
SESSION_SECRET=replace_with_secure_value
COOKIE_TIME=7
CLIENT_URL=http://localhost:5173,http://127.0.0.1:5173
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Start backend:

```bash
cd api
npm install
npm run dev
```

### 2) Frontend (`client/.env`)

```env
VITE_BASE_URL=http://localhost:8001
VITE_ML_API_URL=http://localhost:5001
```

Start frontend:

```bash
cd client
npm install
npm run dev -- --host
```

### 3) ML service (optional but recommended)

Run the Python ML API so planner/recommendation routes can use ML-first responses:

```bash
python ml/tourism_knn_api.py
```

---

## Useful endpoints

- `GET /` → API health
- `GET /tourism/search?q=<query>`
- `GET /tourism/destination/:name`
- `POST /chatbot/chat`
- `POST /chatbot/assistant` (ML-first path via frontend utility)

---

## Dataset notes

Key dataset files currently used in the codebase:

- `dataset/india_tourism_dataset.json`
- `dataset/hidden_places_states.json`
- `dataset/hidden_places_territories.json`
- `api/data/indian_travel_dataset.json`

For ML training details, see [`ML_FEATURES.md`](ML_FEATURES.md).

---

## Repository structure

```text
OTT website/
├─ client/
├─ api/
├─ ml/
├─ dataset/
├─ docs/screenshots/
├─ ALGORITHMS.md
├─ ML_FEATURES.md
├─ DEPLOYMENT.md
├─ DESIGN_SYSTEM.md
└─ MASTER_PROJECT_REPORT_MARCH_2026.md
```

---

## Screenshots

#### 1) Search Bar with Results
![Search Bar with Results](docs/screenshots/01-search-bar-with-results.png)

#### 2) AI Smart Recommendation
![AI Smart Recommendation](docs/screenshots/02-ai-smart-recommendation.png)

#### 3) Budget Planner
![Budget Planner](docs/screenshots/03-budget-planner.png)

#### 4) Hidden Gems
![Hidden Gems](docs/screenshots/04-hidden-gems.png)

#### 5) Chatbot
![Chatbot](docs/screenshots/05-chatbot.png)

---

## Additional docs

- Deployment steps: [`DEPLOYMENT.md`](DEPLOYMENT.md)
- Algorithms and scoring: [`ALGORITHMS.md`](ALGORITHMS.md)
- ML pipeline notes: [`ML_FEATURES.md`](ML_FEATURES.md)
- Product + engineering report: [`MASTER_PROJECT_REPORT_MARCH_2026.md`](MASTER_PROJECT_REPORT_MARCH_2026.md)
