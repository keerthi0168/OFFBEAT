import axios from 'axios';

const resolveBaseUrl = () => {
  const configured = import.meta.env.VITE_BASE_URL || 'http://localhost:8001';

  try {
    const parsed = new URL(configured, window.location.origin);
    const currentHost = window.location.hostname;
    const isLocalHost = ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);
    const currentIsLocalHost = ['localhost', '127.0.0.1', '::1'].includes(currentHost);

    if (isLocalHost && currentHost && !currentIsLocalHost) {
      parsed.hostname = currentHost;
    }

    return parsed.toString().replace(/\/$/, '');
  } catch (error) {
    return configured;
  }
};

const axiosInstance = axios.create({
  baseURL: resolveBaseUrl(),
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default axiosInstance;
