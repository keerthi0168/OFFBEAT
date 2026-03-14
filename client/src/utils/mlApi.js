import axios from 'axios';

export const getMlApiBaseUrl = () => {
  const configured = import.meta.env.VITE_ML_API_URL;
  if (configured) {
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
  }

  const protocol = window.location.protocol || 'http:';
  const hostname = window.location.hostname || 'localhost';
  return `${protocol}//${hostname}:5001`;
};

export const getFriendlyMlError = (error, fallbackMessage) => {
  const status = error?.response?.status;

  if (status === 404) {
    return 'We could not find matching places right now. Try another destination.';
  }

  if (status === 400) {
    return 'Please check your input and try again.';
  }

  if (error?.code === 'ECONNABORTED') {
    return 'The AI service is taking too long. Please try again in a moment.';
  }

  return fallbackMessage;
};

const mlApi = axios.create({
  baseURL: getMlApiBaseUrl(),
  timeout: 15000,
});

export const fetchTrendingRankings = async ({ limit = 12, refresh = false } = {}) => {
  const { data } = await mlApi.get('/trending-rankings', {
    params: { limit, refresh },
  });
  return data;
};

export const trackMlInteraction = async (payload) => {
  const { data } = await mlApi.post('/interaction-track', payload);
  return data;
};

export const fetchUserRecommendations = async ({ userId, limit = 10 } = {}) => {
  const { data } = await mlApi.get('/user-recommendations', {
    params: { user_id: userId, limit },
  });
  return data;
};

export const fetchSimilarDestinations = async (params = {}) => {
  const { data } = await mlApi.get('/similar-destinations', { params });
  return data;
};

export const generateTravelPlan = async (payload) => {
  const { data } = await mlApi.post('/travel-planner', payload);
  return data;
};

export const askTravelAssistant = async (payload) => {
  const { data } = await mlApi.post('/chatbot/assistant', payload);
  return data;
};

export const autoAssignImageCategories = async ({ datasetRoot, limit = 200 } = {}) => {
  const { data } = await mlApi.post('/image-categories/assign', {
    dataset_root: datasetRoot,
    limit,
  });
  return data;
};

export default mlApi;