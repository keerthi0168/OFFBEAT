# Deployment Guide (Frontend + API + ML)

This document covers practical deployment options for the current project structure.

## Preferred stack

- **Frontend:** Netlify (from `client/`)
- **Backend API:** Render/Railway (from `api/`)
- **ML service:** separate Python host (Render/Railway/VM) for `ml/tourism_knn_api.py`

---

## 1) Backend API deployment (`api/`)

### Required environment variables

Use the same keys expected in `api/index.js` and controllers:

- `NODE_ENV=production`
- `PORT=8001` (platform may override)
- `DB_URL=<mongodb-connection-string>`
- `MYSQL_HOST=<host>`
- `MYSQL_USER=<user>`
- `MYSQL_PASSWORD=<password>`
- `MYSQL_DATABASE=<database>`
- `JWT_SECRET=<secure-value>`
- `SESSION_SECRET=<secure-value>`
- `COOKIE_TIME=7`
- `CLIENT_URL=https://<your-frontend-domain>`
- `CLOUDINARY_NAME=<value>`
- `CLOUDINARY_API_KEY=<value>`
- `CLOUDINARY_API_SECRET=<value>`

### Health check

After deploy, verify:

- `GET /` returns `{ status: "ok" }`

---

## 2) Frontend deployment (`client/`)

Build command:

- `npm run build`

Publish directory:

- `dist`

Required environment variables:

- `VITE_BASE_URL=https://<api-domain>`
- `VITE_ML_API_URL=https://<ml-domain>`

---

## 3) ML service deployment (`ml/`)

Deploy `ml/tourism_knn_api.py` as a separate Python web service.

Recommended:

- expose service on a public HTTPS URL
- set `VITE_ML_API_URL` in frontend to that URL
- monitor request timeout/fallback behavior (frontend already has fallback to Node chatbot endpoints)

---

## Temporary sharing (demo)

Use ngrok/cloudflared for temporary public URLs when you need quick testing without full deployment.

Remember to update:

- `CLIENT_URL` in API env
- `VITE_BASE_URL` / `VITE_ML_API_URL` in frontend env

---

## Deployment checklist

- [ ] API env keys added correctly
- [ ] Frontend env keys added correctly
- [ ] CORS allows deployed frontend origin (`CLIENT_URL`)
- [ ] API health endpoint reachable
- [ ] Login/register flow tested
- [ ] Chatbot and planner tested with ML URL set
- [ ] Image upload paths validated (Cloudinary)

---

## Common pitfalls

1. **Wrong env key name** (for example using `MONGODB_URI` while code expects `DB_URL`).
2. **Missing comma-separated origins in `CLIENT_URL`** when multiple domains are used.
3. **ML URL not set**, causing avoidable fallback-only behavior.
4. **Cookie/session issues** when `NODE_ENV=production` without correct HTTPS domain setup.
