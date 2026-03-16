# Offbeat Travel India

Modern React + Node platform to discover offbeat Indian destinations, with ML-assisted search/recommendations and chatbot support.

## What’s included

- Explore page with semantic + lexical fallback search (handles short and UT/state queries better)
- Similar destinations (cosine-based) with user-friendly inputs
- Premium profile dashboard (host/guest style UX)
- Tourism + dataset APIs with merged `dataset/*.json` loading
- Chatbot with conversation memory follow-ups (budget / best time / trip days)

## Quick start

### 1) Backend

Create `api/.env`:

```env
PORT=8001
MONGODB_URI=mongodb://localhost:27017/travel-db
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=travel_db
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:5173
```

Run backend:

```bash
cd api
npm install
npm start
```

### 2) Frontend

Create `client/.env`:

```env
VITE_BASE_URL=http://localhost:8001
VITE_ML_API_URL=http://localhost:5001
```

Run frontend:

```bash
cd client
npm install
npm run dev
```

## Why data is in different files

This is intentional and helps scalability:

- `offbeat_places.json` = master source
- `dataset/*.json` = per state/UT split files (faster maintenance and updates)
- backend merges all `dataset/*.json` + curated sources into one tourism feed at runtime

So if `Daman` exists in any split file, it should be searchable through tourism endpoints.

## Project structure

```text
OTT website/
├─ client/                 # React + Vite frontend
│  ├─ src/
│  │  ├─ pages/            # Explore, Profile, destination views, etc.
│  │  ├─ components/       # UI components
│  │  └─ hooks/
│  └─ public/
├─ api/                    # Express backend APIs
│  ├─ controllers/         # route handlers
│  ├─ routes/              # API route wiring
│  ├─ models/              # Mongo/MySQL models
│  ├─ middlewares/
│  └─ data/                # tourism/chatbot datasets
├─ ml/                     # Python ML API + recommendation logic
│  └─ tourism_knn_api.py
├─ dataset/                # split state/UT JSON datasets
├─ data_hub/               # organized data mirrors + manifests
├─ scripts/                # data utility scripts
└─ README.md
```

## Screenshots

> Why images were not loading: currently this repo has no image files in `docs/screenshots/` (only `docs/screenshots/README.md`), so markdown image tags render as broken placeholders.

Add screenshots in `docs/screenshots/` using either of these naming sets:

### Preferred names (latest)

1. `01-explore-hero-goa-search.png`
2. `02-featured-listings-goa.png`
3. `03-similar-destinations-form-goa.png`
4. `04-ai-travel-planner-form.png`
5. `05-hidden-gems-grid.png`
6. `06-adventure-listings-grid.png`
7. `07-chatbot-assistant.png` *(optional)*
8. `08-explore-no-results-goa.png` *(optional debug screenshot)*

### Legacy names (still accepted)

1. `01-home-hero.png`
2. `02-featured-listings.png`
3. `03-similar-destinations-form.png`
4. `04-ai-travel-planner.png`
5. `05-hidden-gems-grid.png`
6. `06-similar-daman-input.png`
7. `07-explore-search-results.png`
8. `08-chatbot-assistant.png`
9. `09-explore-no-results-goa.png`

Screenshot links (non-breaking) once files are added:

- [Explore Hero (Goa Search)](docs/screenshots/01-explore-hero-goa-search.png)
- [Featured Listings (Goa)](docs/screenshots/02-featured-listings-goa.png)
- [Similar Destinations Form (Goa)](docs/screenshots/03-similar-destinations-form-goa.png)
- [AI Travel Planner Form](docs/screenshots/04-ai-travel-planner-form.png)
- [Hidden Gems Grid](docs/screenshots/05-hidden-gems-grid.png)
- [Adventure Listings Grid](docs/screenshots/06-adventure-listings-grid.png)
- [Chatbot Assistant](docs/screenshots/07-chatbot-assistant.png)
- [Explore No Results Goa](docs/screenshots/08-explore-no-results-goa.png)

Legacy links:

- [Home](docs/screenshots/01-home-hero.png)
- [Similar Destinations](docs/screenshots/03-similar-destinations-form.png)
- [Daman Search Input](docs/screenshots/06-similar-daman-input.png)
- [Explore Results](docs/screenshots/07-explore-search-results.png)
- [Chatbot Assistant (legacy)](docs/screenshots/08-chatbot-assistant.png)
- [Explore No Results Goa (legacy)](docs/screenshots/09-explore-no-results-goa.png)

## Useful docs

- `DEPLOYMENT.md`
- `DESIGN_SYSTEM.md`
- `ALGORITHMS.md`

---

_Docs metadata refresh: 2026-03-16 (non-functional documentation-only update)._
