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
  const description = place?.extraInfo || place?.description || 'Enjoy local highlights and authentic experiences.';

  const pros = [
    place?.eco_score >= 4 ? 'High eco value and scenic surroundings' : null,
    place?.family_friendly ? 'Family-friendly destination' : null,
    place?.rating >= 4.5 ? 'Highly rated by travelers' : null,
    Array.isArray(place?.activities) && place.activities.length
      ? `${place.activities.slice(0, 2).join(', ')} experiences available`
      : null,
  ].filter(Boolean);

  const cons = [
    /difficult/i.test(String(place?.transport_access || '')) ? 'Accessibility can be challenging' : null,
    /high|very high/i.test(String(place?.crowd_level || '')) ? 'Can be crowded during peak windows' : null,
    place?.eco_score <= 2 ? 'Limited eco infrastructure' : null,
  ].filter(Boolean);

  return {
    place_name: place?.title || place?.name || place?.Destination_Name || 'Destination',
    category: place?.category || place?.type || 'Nature',
    region: place?.region || place?.direction || 'Any',
    state: place?.state || place?.State || place?.address?.split(',')?.[1]?.trim() || 'India',
    rating: toNumber(place?.rating, 4.2),
    estimated_cost: Math.max(900, Math.round(price)),
    highlight: description,
    description,
    best_season: Array.isArray(place?.best_season) ? place.best_season : [],
    activities: Array.isArray(place?.activities) ? place.activities : [],
    coordinates: place?.coordinates || null,
    budget_range: place?.budget_range || '',
    pros,
    cons,
  };
};

const REGION_ADJACENCY = {
  north: new Set(['north', 'north east', 'west', 'central']),
  south: new Set(['south', 'west', 'east', 'central']),
  east: new Set(['east', 'north east', 'south', 'central']),
  west: new Set(['west', 'north', 'south', 'central']),
  central: new Set(['north', 'south', 'east', 'west']),
  'north east': new Set(['north east', 'north', 'east']),
};

const norm = (value = '') => String(value || '').trim().toLowerCase();

const regionDistancePenalty = (fromRegion = '', toRegion = '') => {
  const from = norm(fromRegion);
  const to = norm(toRegion);
  if (!from || !to || from === to) return 0;
  if (REGION_ADJACENCY[from]?.has(to)) return 5;
  return 18;
};

const scoreCandidate = ({
  candidate,
  prev,
  preferredCategory,
  targetDailyBudget,
  remainingBudget,
}) => {
  const categoryNeedle = norm(preferredCategory);
  const hasCategoryPreference = Boolean(categoryNeedle && categoryNeedle !== 'any');
  const candidateCategory = norm(candidate?.category);

  const categoryScore = hasCategoryPreference
    ? (candidateCategory.includes(categoryNeedle) ? 24 : -6)
    : 8;

  const ratingScore = Math.min(30, (toNumber(candidate?.rating, 4) / 5) * 30);

  const budgetGap = Math.abs(toNumber(candidate?.estimated_cost, targetDailyBudget) - targetDailyBudget);
  const budgetScore = Math.max(-12, 22 - budgetGap / 240);
  const overRemainingPenalty = toNumber(candidate?.estimated_cost, 0) > remainingBudget ? 10 : 0;

  let continuityScore = 0;
  if (prev) {
    if (norm(prev.state) && norm(candidate.state) && norm(prev.state) === norm(candidate.state)) {
      continuityScore += 16;
    }
    if (norm(prev.region) && norm(candidate.region) && norm(prev.region) === norm(candidate.region)) {
      continuityScore += 12;
    }
    continuityScore -= regionDistancePenalty(prev.region, candidate.region);
  }

  const diversityBonus = !prev || norm(prev.place_name) !== norm(candidate.place_name) ? 3 : -20;

  return ratingScore + categoryScore + budgetScore + continuityScore + diversityBonus - overRemainingPenalty;
};

const buildDayCostBreakdown = (estimatedDayCost = 2200) => {
  const stay = Math.round(estimatedDayCost * 0.42);
  const food = Math.round(estimatedDayCost * 0.22);
  const localTransport = Math.round(estimatedDayCost * 0.18);
  const activities = Math.round(estimatedDayCost * 0.18);
  return {
    stay,
    food,
    local_transport: localTransport,
    activities,
    total: stay + food + localTransport + activities,
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
    .slice(0, Math.max(24, numberOfDays * 6));

  const dailyBudget = Math.max(900, Math.floor(budget / numberOfDays));
  const itinerary = [];
  const used = new Set();
  let runningCost = 0;

  for (let day = 1; day <= numberOfDays; day += 1) {
    const prev = itinerary[itinerary.length - 1]?.destination || null;
    const remainingDays = numberOfDays - day + 1;
    const remainingBudget = Math.max(dailyBudget, budget - runningCost);
    const targetDailyBudget = Math.max(dailyBudget, Math.floor(remainingBudget / remainingDays));

    const pool = candidates.filter((item) => !used.has(norm(item.place_name)));
    const fallbackPool = pool.length ? pool : candidates;

    const scored = fallbackPool
      .map((candidate) => ({
        candidate,
        score: scoreCandidate({
          candidate,
          prev,
          preferredCategory,
          targetDailyBudget,
          remainingBudget,
        }),
      }))
      .sort((a, b) => b.score - a.score);

    const destination = scored[0]?.candidate || candidates[(day - 1) % candidates.length];
    used.add(norm(destination.place_name));

    const dayCost = Math.max(900, Math.round(toNumber(destination?.estimated_cost, targetDailyBudget)));
    runningCost += dayCost;
    const cost_breakdown = buildDayCostBreakdown(dayCost);

    itinerary.push({
      day,
      destination,
      estimated_day_cost: dayCost,
      cost_breakdown,
      highlight:
        destination?.highlight ||
        `Explore ${destination?.place_name} with a balanced mix of local culture and signature experiences.`,
      pros: Array.isArray(destination?.pros) && destination.pros.length
        ? destination.pros
        : ['Great local experiences', 'Good photo opportunities'],
      cons: Array.isArray(destination?.cons) && destination.cons.length
        ? destination.cons
        : ['Check local transport in advance'],
    });
  }

  const estimatedTotal = itinerary.reduce((sum, item) => sum + toNumber(item.estimated_day_cost, 0), 0);
  const coveredRegions = [...new Set(itinerary.map((d) => d.destination?.region).filter(Boolean))];
  const coveredStates = [...new Set(itinerary.map((d) => d.destination?.state).filter(Boolean))];

  const continuityPenalty = itinerary.slice(1).reduce((acc, day, index) => {
    const prev = itinerary[index]?.destination;
    const cur = day.destination;
    return acc + regionDistancePenalty(prev?.region, cur?.region);
  }, 0);

  const routeQuality = Math.max(0, Math.min(100, 100 - continuityPenalty * 3));

  return {
    success: true,
    source: 'fallback',
    itinerary,
    summary: {
      estimated_total_cost: estimatedTotal,
      budget,
      number_of_days: numberOfDays,
      covered_regions: coveredRegions,
      covered_states: coveredStates,
      route_quality_score: routeQuality,
      cost_efficiency: estimatedTotal <= budget ? 'within-budget' : 'above-budget',
    },
    message: 'Generated using weighted recommendation scoring and continuity-aware route optimization.',
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