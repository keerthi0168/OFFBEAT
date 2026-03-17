import axios from 'axios';
import axiosInstance from '@/utils/axios';

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

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizePlannerPlace = (place = {}) => {
  const price = toNumber(place?.price ?? place?.budgetMin ?? place?.budgetMax, 2200);
  return {
    place_name: place?.title || place?.name || place?.Destination_Name || 'Destination',
    category: place?.category || place?.type || 'Nature',
    region: place?.region || place?.direction || 'Any',
    state: place?.state || place?.State || place?.address?.split(',')?.[1]?.trim() || 'India',
    rating: toNumber(place?.rating, 4.2),
    estimated_cost: Math.max(900, Math.round(price)),
    highlight: place?.extraInfo || place?.description || 'Enjoy local highlights and authentic experiences.',
  };
};

const buildFallbackTravelPlan = async (payload = {}) => {
  const budget = Math.max(1000, toNumber(payload?.budget, 25000));
  const numberOfDays = Math.max(1, toNumber(payload?.number_of_days, 5));
  const preferredCategory = String(payload?.preferred_category || 'Any').trim();
  const region = String(payload?.region || 'Any').trim();

  const { data } = await axiosInstance.get('/tourism/all');
  const allPlaces = Array.isArray(data?.destinations) ? data.destinations : [];

  if (!allPlaces.length) {
    return {
      success: false,
      message: 'No destinations available for itinerary right now.',
      itinerary: [],
      summary: { estimated_total_cost: 0 },
    };
  }

  const categoryNeedle = preferredCategory.toLowerCase();
  const regionNeedle = region.toLowerCase();

  const filtered = allPlaces.filter((place) => {
    const placeCategory = String(place?.category || place?.type || '').toLowerCase();
    const placeRegion = String(place?.region || place?.direction || '').toLowerCase();
    const categoryOk = categoryNeedle === 'any' || !categoryNeedle || placeCategory.includes(categoryNeedle);
    const regionOk = regionNeedle === 'any' || !regionNeedle || placeRegion.includes(regionNeedle);
    return categoryOk && regionOk;
  });

  const candidates = (filtered.length ? filtered : allPlaces)
    .map(normalizePlannerPlace)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, Math.max(10, numberOfDays * 3));

  const dailyBudget = Math.max(800, Math.floor(budget / numberOfDays));
  const itinerary = [];

  for (let day = 1; day <= numberOfDays; day += 1) {
    const exact = candidates.find((item) => item.estimated_cost <= dailyBudget && !itinerary.some((x) => x.destination?.place_name === item.place_name));
    const fallback = candidates.find((item) => !itinerary.some((x) => x.destination?.place_name === item.place_name));
    const destination = exact || fallback || candidates[(day - 1) % candidates.length];

    itinerary.push({
      day,
      destination,
      estimated_day_cost: destination?.estimated_cost || dailyBudget,
      highlight: destination?.highlight || 'Explore local culture and landscapes.',
    });
  }

  const estimatedTotal = itinerary.reduce((sum, item) => sum + toNumber(item.estimated_day_cost, 0), 0);

  return {
    success: true,
    source: 'fallback',
    itinerary,
    summary: {
      estimated_total_cost: estimatedTotal,
      budget,
      number_of_days: numberOfDays,
    },
    message: 'Showing a reliable local itinerary while AI planner warms up.',
  };
};

export const generateTravelPlan = async (payload) => {
  try {
    const { data } = await mlApi.post('/travel-planner', payload);
    return data;
  } catch (mlError) {
    return buildFallbackTravelPlan(payload);
  }
};

export const askTravelAssistant = async (payload) => {
  try {
    const { data } = await mlApi.post('/chatbot/assistant', payload, { timeout: 9000 });

    const responseText = String(data?.response || '').toLowerCase();
    const isLowConfidence =
      !data?.response ||
      data?.category === 'unknown' ||
      data?.type === 'unknown' ||
      responseText.includes("i'm not sure") ||
      responseText.includes('could you rephrase') ||
      responseText.includes('not sure i understand');

    if (!isLowConfidence) {
      return data;
    }

    try {
      const { data: fallbackData } = await axiosInstance.post('/chatbot/chat', payload, { timeout: 7000 });
      return fallbackData;
    } catch (fallbackError) {
      return data;
    }
  } catch (mlError) {
    // Fallback to Node chatbot for better resilience when ML service is slow/unavailable.
    const { data } = await axiosInstance.post('/chatbot/chat', payload, { timeout: 7000 });
    return data;
  }
};

export const autoAssignImageCategories = async ({ datasetRoot, limit = 200 } = {}) => {
  const { data } = await mlApi.post('/image-categories/assign', {
    dataset_root: datasetRoot,
    limit,
  });
  return data;
};

export default mlApi;