# 🏔️ Offbeat Travel India - Discover Hidden Destinations

A modern travel platform for exploring India's hidden gems and offbeat destinations, built with **React** and powered by AI-driven recommendations.

---

## 🚀 Tech Stack

### Frontend (React)
- **React 18** - Modern UI library with hooks and functional components
- **React Router DOM** - Client-side routing and navigation
- **Vite** - Lightning-fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework with custom design system
- **Radix UI** - Accessible component primitives
- **Axios** - Promise-based HTTP client
- **React Toastify** - Beautiful toast notifications
- **React Day Picker** - Date selection for bookings
- **Lucide React** - Beautiful icon library

### Backend (Node.js)
- **Express.js** - Fast, minimalist web framework
- **MongoDB** with Mongoose - NoSQL database for main data
- **MySQL** - Relational database for user management
- **JWT** - Secure authentication
- **Bcrypt** - Password hashing
- **Cloudinary** - Image upload and management
- **Cookie Parser** - Cookie handling

### AI/ML Features
- **TF-IDF** - Search and content recommendation
- **Cosine Similarity** - Personalized destination matching
- **NLP Tokenization** - Intelligent text processing
- **Collaborative Filtering** - Similar property recommendations

---

## ✨ Key Features

### 🔐 User Features
- **Google OAuth & Email Authentication** - Secure login options
- **Profile Management** - Edit profile, upload photos, view bookings
- **Smart Search** - AI-powered destination discovery
- **Personalized Recommendations** - Based on user preferences
- **Interactive Chatbot** - 24/7 travel assistance

### 🏨 Place Management
- **Add/Edit Listings** - Property owners can manage their places
- **Photo Gallery** - Upload multiple images via link or Cloudinary
- **Amenities & Perks** - Wifi, parking, pets, entrance, etc.
- **Price & Guest Management** - Set pricing and max guests

### 📅 Booking System
- **Date Range Selection** - React-based date picker
- **Guest Information** - Name, phone, email validation
- **Real-time Pricing** - Dynamic calculation based on dates
- **Booking History** - View past and upcoming trips

### 🤖 AI-Powered Features
- **Smart Recommendations** - TF-IDF based similarity scoring
- **Category Search** - Beach, Hill Station, Temple, Garden, National Park
- **Tourism Dataset** - 500+ curated offbeat destinations
- **Chatbot Integration** - Natural language travel queries

### 📊 Admin Dashboard
- **User Management** - View and manage all users
- **Booking Analytics** - Track all bookings and revenue
- **Place Monitoring** - Manage listed properties
- **Database Stats** - Real-time metrics

---

## 📂 Project Structure

```
OTT website/
├── client/                           # React Frontend
│   ├── src/
│   │   ├── App.jsx                  # Main app component
│   │   ├── main.jsx                 # React entry point
│   │   ├── components/ui/           # Reusable React components
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── BookingWidget.jsx
│   │   │   ├── ChatbotWidget.jsx
│   │   │   └── ...
│   │   ├── pages/                   # React page components
│   │   │   ├── IndexPage.jsx        # Home page
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── ExplorePage.jsx
│   │   │   ├── PlacesPage.jsx
│   │   │   ├── BookingsPage.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── providers/               # React Context providers
│   │   │   ├── UserProvider.jsx
│   │   │   └── PlaceProvider.jsx
│   │   └── utils/                   # Utility functions
│   ├── vite.config.js               # Vite configuration
│   ├── tailwind.config.cjs          # Tailwind CSS config
│   └── package.json
│
├── api/                             # Node.js Backend
│   ├── index.js                     # Express server entry
│   ├── controllers/                 # Route handlers
│   │   ├── userController.js
│   │   ├── placeController.js
│   │   ├── bookingController.js
│   │   ├── chatbotController.js
│   │   ├── recommendationController.js
│   │   ├── tourismController.js
│   │   └── analyticsController.js
│   ├── models/                      # Database schemas
│   │   ├── User.js                  # MongoDB
│   │   ├── UserMySQL.js             # MySQL
│   │   ├── Place.js
│   │   └── Booking.js
│   ├── routes/                      # API routes
│   ├── middlewares/                 # Custom middleware
│   ├── data/                        # Tourism datasets
│   └── scripts/                     # ML model training scripts
│
├── ALGORITHMS.md                    # AI/ML documentation
├── DEPLOYMENT.md                    # Deployment guide
└── DESIGN_SYSTEM.md                 # UI/UX design system
```

---

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 16+ 
- MongoDB
- MySQL
- Cloudinary Account (for image uploads)

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd "OTT website"
```

### 2. Backend Setup
```bash
cd api
npm install
```

Create `api/.env`:
```env
PORT=8001
MONGODB_URI=mongodb://localhost:27017/travel-db
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=travel_db
JWT_SECRET=your_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Start backend:
```bash
npm run dev
```

### 3. Frontend Setup (React)
```bash
cd client
npm install
```

Create `client/.env`:
```env
VITE_BASE_URL=http://localhost:8001
```

Start React development server:
```bash
npm run dev
```

### 4. Database Setup

#### MongoDB Collections (Auto-created):
- `users` - User profiles and authentication
- `places` - Travel destination listings
- `bookings` - Reservation records

#### MySQL Tables:
Run the SQL schema in your MySQL database for user management.

---

## 🎨 Design System

- **Color Scheme**: Navy Blue (#0B1220) + Muted Gold (#C9A96E)
- **Typography**: Inter font with light weights
- **Components**: Glassmorphic cards with backdrop blur
- **Interactions**: Smooth 300ms transitions

See [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) for complete guidelines.

---

## 🤖 AI/ML Algorithms

- **TF-IDF Vectorization** - Document similarity and ranking
- **Cosine Similarity** - Personalized recommendations
- **Text Tokenization** - NLP preprocessing
- **Property Similarity Scoring** - Multi-factor matching

See [ALGORITHMS.md](ALGORITHMS.md) for detailed explanations.

---

## 🚀 Deployment

Deploy to production using:
- **Frontend**: Netlify or Vercel (React optimized)
- **Backend**: Render or Railway
- **Database**: MongoDB Atlas + PlanetScale (MySQL)

See [DEPLOYMENT.md](DEPLOYMENT.md) for step-by-step guides.

---

## 📱 React Components

### Main Pages
- `IndexPage` - Hero section with search
- `ExplorePage` - Browse destinations by category
- `PlacesPage` - Manage your listings
- `PlacePage` - Detailed place view
- `BookingsPage` - View your bookings
- `AdminDashboard` - Admin analytics

### Reusable Components
- `Header` - Navigation with auth
- `Footer` - Site footer
- `BookingWidget` - Date/guest selection
- `ChatbotWidget` - AI assistant
- `PlaceCard` - Destination card
- `Categories` - Filter categories
- `PerksWidget` - Amenities selector

---

## 📄 License

This project is for educational purposes.

---

## 👨‍💻 Author

Built with ❤️ using **React** and modern web technologies.
