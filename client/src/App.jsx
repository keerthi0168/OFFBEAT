import { Routes, Route } from 'react-router-dom';
import Layout from './components/ui/Layout';
import IndexPage from './pages/IndexPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import PlacesPage from './pages/PlacesPage';
import PlacesFormPage from './pages/PlacesFormPage';
import PlacePage from './pages/PlacePage';
import BookingsPage from './pages/BookingsPage';
import SingleBookedPlace from './pages/SingleBookedPlace';
import NotFoundPage from './pages/NotFoundPage';
import AdminDashboard from './pages/AdminDashboard';
import { UserProvider } from './providers/UserProvider';
import { PlaceProvider } from './providers/PlaceProvider';
import ErrorBoundary from './components/ui/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <UserProvider>
        <PlaceProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<IndexPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<RegisterPage />} />
              <Route path="/account" element={<ProfilePage />} />
              <Route path="/account/places" element={<PlacesPage />} />
              <Route path="/account/places/new" element={<PlacesFormPage />} />
              <Route path="/account/places/:id" element={<PlacesFormPage />} />
              <Route path="/place/:id" element={<PlacePage />} />
              <Route path="/account/bookings" element={<BookingsPage />} />
              <Route path="/account/bookings/:id" element={<SingleBookedPlace />} />
              <Route path="/account/admin" element={<AdminDashboard />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </PlaceProvider>
      </UserProvider>
    </ErrorBoundary>
  );
}

export default App;