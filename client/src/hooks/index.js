import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '@/utils/axios';
import { UserContext } from '@/providers/UserProvider';
import { PlaceContext } from '@/providers/PlaceProvider';

// Custom hook for authentication logic
export const useProvideAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // You could verify token with backend here if needed
          const userData = localStorage.getItem('user');
          if (userData) {
            setUser(JSON.parse(userData));
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const register = async (data) => {
    try {
      const response = await axios.post('/register', data);
      if (response.data.success || response.data.user) {
        const userData = response.data.user;
        setUser(userData);
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(userData));
        return { success: true, message: 'Registration successful', user: userData };
      }
      return { success: false, message: response.data.message || 'Registration failed' };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Registration failed';
      return { success: false, message };
    }
  };

  const login = async (data) => {
    try {
      const response = await axios.post('/login', data);
      if (response.data.success || response.data.user) {
        const userData = response.data.user;
        setUser(userData);
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(userData));
        return { success: true, message: 'Login successful', user: userData };
      }
      return { success: false, message: response.data.message || 'Login failed' };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Login failed';
      return { success: false, message };
    }
  };

  const googleLogin = async (credential) => {
    try {
      // Decode the JWT token from Google
      const decoded = JSON.parse(atob(credential.split('.')[1]));
      const response = await axios.post('/google-login', {
        name: decoded.name,
        email: decoded.email,
        picture: decoded.picture,
      });

      if (response.data.success || response.data.user) {
        const userData = response.data.user;
        setUser(userData);
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(userData));
        return { success: true, message: 'Google login successful', user: userData };
      }
      return { success: false, message: 'Google login failed' };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Google login failed';
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      await axios.get('/logout');
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return { success: true, message: 'Logout successful' };
    } catch (error) {
      const message = error.message || 'Logout failed';
      return { success: false, message };
    }
  };

  const updateUserDetails = async (data) => {
    try {
      const response = await axios.put('/update-user', data);
      if (response.data.success) {
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return { success: true, message: 'Profile updated successfully', user: response.data.user };
      }
      return { success: false, message: response.data.message || 'Update failed' };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Update failed';
      return { success: false, message };
    }
  };

  return {
    user,
    loading,
    register,
    login,
    googleLogin,
    logout,
    updateUserDetails,
  };
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useAuth must be used within UserProvider');
  }
  return context;
};

// Hook for navigation
export const useCustomNavigate = () => {
  return useNavigate();
};

// Hook for places management
export const useProvidePlaces = () => {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPlaces();
  }, []);

  const fetchPlaces = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/places');
      setPlaces(response.data?.places || response.data || []);
    } catch (error) {
      console.error('Error fetching places:', error);
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    places,
    setPlaces,
    loading,
    setLoading,
    fetchPlaces,
  };
};

// Hook to use places context
export const usePlaces = () => {
  const context = useContext(PlaceContext);
  if (!context) {
    throw new Error('usePlaces must be used within PlaceProvider');
  }
  return context;
};
