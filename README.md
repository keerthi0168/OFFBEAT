# 🏠 SpaceBook - Luxury Property Booking Platform

A premium full-stack property booking application with a sophisticated luxury design system, featuring real property listings from across India.

![Tech Stack](https://img.shields.io/badge/MERN-Stack-green)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?logo=mongodb&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?logo=express)
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)

## ✨ Features

### User Features
- 🔐 **Secure Authentication** - JWT-based auth with bcrypt password hashing
- 🏡 **Property Listings** - Browse 300+ real properties from Mumbai, Kolkata, Hyderabad, Gurgaon, and tourist destinations
- 🔍 **Smart Search** - Filter by location, dates, and number of guests
- 📅 **Booking System** - Seamless booking with date range selection
- 💳 **Profile Management** - Update profile, view bookings, manage listings
- 📸 **Photo Gallery** - Full-screen image viewer with navigation
- 🎨 **Luxury UI/UX** - Premium design with navy, muted gold, and teal accents

### Admin Features
- 📊 **Admin Dashboard** - Manage users and view analytics
- 🏢 **Property Management** - Create, edit, and delete property listings
- 🖼️ **Image Upload** - Cloudinary integration for photo storage

### Technical Features
- 🎯 **Dual Database** - MongoDB for properties/bookings, MySQL for users
- 🔄 **RESTful API** - Clean API architecture with Express.js
- 🎨 **Design System** - Consistent luxury color palette across all components
- 📱 **Responsive Design** - Mobile-first approach with Tailwind CSS
- 🚀 **Performance** - Optimized with React context and efficient state management
- 📦 **Git LFS** - Large CSV datasets managed with Git Large File Storage

## 🎨 Luxury Design System

### Color Palette
```javascript
{
  navy: '#0B1220',        // Primary background
  mutedGold: '#C9A96E',   // Premium accents
  teal: '#1F8A8A',        // Interactive elements
  softWhite: '#E5E7EB'    // Text and borders
}
```

### Design Principles
- **Glassmorphism** - Semi-transparent cards with `bg-white/5` overlays
- **Premium Typography** - Carefully selected font weights and spacing
- **Elegant Interactions** - Smooth hover effects and transitions
- **Sophisticated Gradients** - Navy-to-black backgrounds with subtle accents

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI library with hooks
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **date-fns** - Date manipulation
- **Shadcn/UI** - Headless component library

### Backend
- **Node.js & Express** - Server runtime and framework
- **MongoDB & Mongoose** - NoSQL database for properties/bookings
- **MySQL & Sequelize** - SQL database for user management
- **JWT** - Secure authentication tokens
- **Cloudinary** - Image storage and optimization
- **Bcrypt** - Password hashing
- **Cookie Parser** - Session management

## 📁 Project Structure

```
myownspace/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/ui/   # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── providers/       # Context providers
│   │   ├── data/            # Tourism data modules
│   │   ├── utils/           # Helper functions
│   │   └── styles/          # Global styles
│   └── package.json
│
├── api/                     # Express backend
│   ├── config/              # Database configurations
│   ├── controllers/         # Route controllers
│   ├── models/              # Database models
│   ├── routes/              # API routes
│   ├── middlewares/         # Custom middleware
│   ├── utils/               # Helper functions
│   ├── data/                # Seed datasets
│   ├── scripts/             # Utility scripts
│   └── package.json
│
├── *.csv                    # Real property datasets (Git LFS)
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- MySQL (local or remote)
- Git LFS (for CSV datasets)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/keerthi0168/spacebook.git
cd spacebook
```

2. **Install Git LFS** (if not already installed)
```bash
git lfs install
git lfs pull
```

3. **Install backend dependencies**
```bash
cd api
npm install
```

4. **Install frontend dependencies**
```bash
cd ../client
npm install
```

### Environment Setup

Create `.env` file in the `api` directory:

```env
# MongoDB
DB_URL=mongodb://localhost:27017/myownspace

# MySQL
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=myownspace

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRY=20d
COOKIE_TIME=7

# Cloudinary (for image uploads)
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Server
PORT=8000
CLIENT_URL=http://localhost:5173
```

### Database Setup

1. **Start MongoDB**
```bash
mongod
```

2. **Create MySQL database**
```sql
CREATE DATABASE myownspace;
```

3. **Seed property data** (optional - adds 300 real properties)
```bash
cd api
npm run seed:converted
```

## 🎯 Running the Application

### Development Mode

1. **Start backend server** (port 8000)
```bash
cd api
npm run dev
```

2. **Start frontend dev server** (port 5173)
```bash
cd client
npm run dev
```

3. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

### Production Build

```bash
# Build frontend
cd client
npm run build

# Start backend in production
cd ../api
npm start
```

## 📜 Available Scripts

### Backend (api/)
```bash
npm start                 # Start production server
npm run dev              # Start development server with nodemon
npm run seed:places      # Seed places from tourism data
npm run convert:csv      # Convert CSV files to Place format
npm run seed:converted   # Seed database with converted CSV data
```

### Frontend (client/)
```bash
npm run dev       # Start Vite dev server
npm run build     # Build for production
npm run preview   # Preview production build
```

## 📊 Dataset Information

The application includes **300+ real property listings** sourced from:

- **Airbnb India Top 500** - Tourist destinations (Manali, Goa, etc.)
- **Mumbai Properties** - Residential listings
- **Kolkata Properties** - Flats and apartments
- **Hyderabad Properties** - Premium residences
- **Gurgaon Properties** - Modern apartments and houses

All CSV datasets are managed with **Git LFS** for efficient version control.

## 🔑 Key Features Breakdown

### Authentication
- User registration and login
- JWT token-based sessions
- Secure password hashing with bcrypt
- Cookie-based authentication

### Property Management
- Create listings with multiple photos
- Edit and delete own properties
- Add amenities/perks
- Set pricing and guest limits
- Location-based search

### Booking System
- Date range selection with calendar
- Guest count specification
- Automatic price calculation
- Booking history for users
- Admin booking overview

### User Interface
- Responsive design for all devices
- Dark luxury theme with premium colors
- Glassmorphism effects
- Smooth animations and transitions
- Optimized image loading

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👤 Author

**Keerthi**
- GitHub: [@keerthi0168](https://github.com/keerthi0168)

## 🙏 Acknowledgments

- India tourism data from various sources
- Real estate datasets from 99acres
- Airbnb India property listings
- Cloudinary for image hosting
- Shadcn/UI for component primitives

---

**Built with ❤️ using the MERN stack**

## Features

- **User Authentication:** Users can sign up, log in, and log out securely. Passwords are hashed for security.
- **Google Login:** Users can sign up and log in using their gmail.

  ![Airbnb Logo](client/public/assets/auth.png)

- **Search Listings:** Users can search for accommodations.

  ![Airbnb Logo](client/public/assets/search.png)

- **View Listings:** Users can view detailed information about each accommodation, including photos, descriptions, amenities.

  ![Airbnb Logo](client/public/assets/view.png)

- **Make Bookings:** Authenticated users can book accommodations for specific dates.

  ![Airbnb Logo](client/public/assets/book.png)

- **Manage Listings:** Hosts can create, edit, and delete their listings.

  ![Airbnb Logo](client/public/assets/manage.png)

- **Responsive Design:** The application is designed to be responsive and work seamlessly across different devices.

  ![Airbnb Logo](client/public/assets/hero.png)

## Technologies Used

- **MongoDB:** NoSQL database for storing user data, listings.
- **Express.js:** Web application framework for building the backend server.
- **React.js:** JavaScript library for building the user interface.
- **Node.js:** JavaScript runtime environment for executing server-side code.
- **Tailwind CSS:** A utility-first CSS framework
- **Shadcn:** UI library for styling based on Tailwind CSS
- **JWT:** JSON Web Tokens for secure user authentication.
- **Cloudinary:** Cloud-based image management for storing and serving images.
- **Google Cloud:** For gmail based authentication
#   m y o w n s p a c e 
 
 