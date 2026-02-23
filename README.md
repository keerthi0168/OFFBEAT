# 🌿 Offbeat Travel India

**Offbeat Travel India** is a travel & tourism platform that showcases **hidden gems across India**, supporting the **Atmanirbhar Bharat** vision by spotlighting local experiences, community-led travel, and lesser-known destinations — **India‑only**.

## ✨ Highlights

- 🗺️ **Hidden Gems**: Curated offbeat destinations across Indian states
- 🇮🇳 **India‑Only Focus**: Entirely Indian travel experiences
- 🧭 **Explore Page**: Destination discovery with categories & smart search
- 🤖 **AI Assistant**: Ask about destinations, regions, and travel styles
- 📊 **Tourism Intelligence**: Category, region, and destination APIs
- 💎 **Luxury UI**: Glassmorphism + navy/gold design system

## 🤖 AI/ML Capabilities

- **AI Chatbot** with tourism‑focused responses
- **Context‑aware suggestions** for travel planning
- **Personalized recommendations** using user behavior signals
- **Destination intelligence** (region, category, accessibility)
- **Searchable travel knowledge base**

## 🛠 Tech Stack

### Frontend
- React + Vite
- Tailwind CSS
- React Router
- Axios

### Backend
- Node.js + Express
- MongoDB (places & experiences)
- MySQL (users & preferences)

### AI/ML
- Lightweight NLP intent matcher
- Tourism knowledge base
- Vector‑based personalization model

## 📁 Project Structure

```
OTT website/
├── client/                # React frontend
├── api/                   # Express backend
├── DESIGN_SYSTEM.md       # UI/UX standards
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14+)
- MongoDB
- MySQL

### Install

```bash
cd api
npm install

cd ../client
npm install
```

### Environment Setup

Copy `.env` in the project root and fill values for:
- `DB_URL`
- `JWT_SECRET`, `JWT_EXPIRY`
- `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`
- `CLOUDINARY_*` (if uploads are enabled)

### Run Development

```bash
cd api
npm run dev

cd ../client
npm run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:8001

## 🧠 ML Training (Tourism Model)

Generate a cached vector model for faster personalization:

```bash
cd api
npm run train:tourism
```

This outputs: `api/data/tourism_model.json`

## 🌏 Tourism API Endpoints

```http
GET  /tourism/destination/:name
GET  /tourism/category/:category
GET  /tourism/region/:region
GET  /tourism/search?query=
GET  /tourism/random?limit=5
POST /tourism/personalized
```

## 🤖 Chatbot Endpoints

```http
POST /chatbot/chat
POST /chatbot/train
GET  /chatbot/stats
POST /chatbot/clear-context
```

## 📌 Notes on Datasets

This project uses local datasets (including a large **18,000+ image** collection). These datasets are not committed by default. Place them in the specified local folders when running the project.

## 👤 Author

**Keerthi**  
GitHub: [@keerthi0168](https://github.com/keerthi0168)

---

**Built for Offbeat India • Atmanirbhar Bharat Vision 🇮🇳**