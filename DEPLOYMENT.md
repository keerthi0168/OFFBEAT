# 🚀 Deploy Your Website for Remote Access

## Quick Option 1: Deploy to Netlify (Frontend) + Render (Backend)

### Step 1: Deploy Backend to Render (Free)

1. Go to https://render.com and sign up
2. Click "New +" → "Web Service"
3. Connect your GitHub repository OR upload your code
4. Configure:
   - **Name**: `offbeat-travel-api`
   - **Root Directory**: `api`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
5. Add Environment Variables:
   - `PORT` = 8001
   - `MONGODB_URI` = your MongoDB connection string
   - `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`
   - `JWT_SECRET` = your secret key
   - `NODE_ENV` = production
6. Click "Create Web Service"
7. **Copy the URL** (e.g., `https://offbeat-travel-api.onrender.com`)

### Step 2: Deploy Frontend to Netlify (Free)

1. Go to https://app.netlify.com and sign up
2. Click "Add new site" → "Deploy manually"
3. Build your frontend first:
   ```bash
   cd client
   npm run build
   ```
4. Drag and drop the `dist` folder to Netlify
5. Once deployed, go to **Site settings** → **Environment variables**
6. Add:
   - `VITE_BASE_URL` = `https://YOUR-BACKEND-URL.onrender.com` (from Step 1)
7. Go to **Deploys** → **Trigger deploy** → **Deploy site**
8. **Copy your Netlify URL** (e.g., `https://your-site.netlify.app`)

### Step 3: Update Backend CORS

Update your backend to allow the Netlify URL:
- In `api/index.js`, update CORS settings to include your Netlify URL

---

## Quick Option 2: Use ngrok (Temporary - Free)

This creates a temporary public URL (expires when you close terminal):

1. Install ngrok: https://ngrok.com/download
2. Sign up and get your auth token
3. Run these commands:

```bash
# In one terminal (Backend)
cd api
npm run dev

# In another terminal (Expose backend)
ngrok http 8001

# Copy the ngrok URL (e.g., https://abc123.ngrok.io)
```

4. Update `client/.env`:
```
VITE_BASE_URL=https://YOUR-NGROK-URL.ngrok.io
```

5. Run frontend:
```bash
cd client
npm run dev
```

6. In another terminal (Expose frontend):
```bash
ngrok http 5173
```

Share the frontend ngrok URL with your friend!

---

## Quick Option 3: Vercel (Frontend) + Railway (Backend)

### Backend on Railway:
1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Add environment variables
6. Copy the Railway URL

### Frontend on Vercel:
1. Go to https://vercel.com
2. Click "Add New" → "Project"
3. Import your repository
4. Set:
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add environment variables:
   - `VITE_BASE_URL` = your Railway backend URL
6. Deploy!

---

## Recommended: Option 1 (Netlify + Render)
- ✅ Free forever
- ✅ Automatic SSL (HTTPS)
- ✅ Custom domain support
- ✅ Easy to maintain

## For Quick Testing: Option 2 (ngrok)
- ✅ Instant setup
- ✅ No code changes needed
- ❌ URL changes every restart
- ❌ Session expires after 2 hours (free plan)

---

## Need Help?
After deploying, share the Netlify/Vercel URL with your friend. They can access it from anywhere in the world!
