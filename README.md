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

## Screenshots

Add images in `docs/screenshots/` with these exact names:

1. `01-home-hero.png`
2. `02-featured-listings.png`
3. `03-similar-destinations-form.png`
4. `04-ai-travel-planner.png`
5. `05-hidden-gems-grid.png`
6. `06-similar-daman-input.png` *(new UI screenshot shared in chat)*
7. `07-explore-search-results.png` *(new UI screenshot shared in chat)*

README renders automatically once files are added:

![Home](docs/screenshots/01-home-hero.png)
![Similar Destinations](docs/screenshots/03-similar-destinations-form.png)
![Daman Search Input](docs/screenshots/06-similar-daman-input.png)
![Explore Results](docs/screenshots/07-explore-search-results.png)

## Useful docs

- `DEPLOYMENT.md`
- `DESIGN_SYSTEM.md`
- `ALGORITHMS.md`
