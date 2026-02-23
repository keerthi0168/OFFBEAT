import axiosInstance from '@/utils/axios';
import { getItemFromLocalStorage } from '@/utils';

const STORAGE_KEY = 'offbeat_travel_india_analytics_events';
const SESSION_KEY = 'offbeat_travel_india_session_id';

const getSessionId = () => {
  const existing = localStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(SESSION_KEY, id);
  return id;
};

const saveLocalEvent = (event) => {
  const raw = localStorage.getItem(STORAGE_KEY);
  const events = raw ? JSON.parse(raw) : [];
  events.push(event);
  const trimmed = events.slice(-1000);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
};

export const trackEvent = async (type, payload = {}) => {
  let userId = payload?.userId;
  if (!userId) {
    try {
      const storedUser = getItemFromLocalStorage('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        userId = parsed?.id || parsed?._id || userId;
      }
    } catch (error) {
      // ignore JSON parse errors
    }
  }

  const event = {
    type,
    payload: {
      ...payload,
      userId: userId || payload?.userId,
    },
    path: window.location.pathname,
    referrer: document.referrer,
    userAgent: navigator.userAgent,
    sessionId: getSessionId(),
    timestamp: new Date().toISOString(),
  };

  saveLocalEvent(event);

  try {
    await axiosInstance.post('/analytics/track', event);
  } catch (error) {
    // Silent fallback to local storage
  }
};

const countBy = (items, selector) => {
  return items.reduce((acc, item) => {
    const key = selector(item);
    if (!key) return acc;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
};

const toTopList = (counts, limit = 5) =>
  Object.entries(counts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);

export const getLocalSummary = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  const events = raw ? JSON.parse(raw) : [];
  const pageViews = events.filter((e) => e.type === 'page_view');
  const searches = events.filter((e) => e.type === 'search');
  const listingViews = events.filter((e) => e.type === 'view_place');

  return {
    totalEvents: events.length,
    pageViews: pageViews.length,
    searches: searches.length,
    listingViews: listingViews.length,
    topPages: toTopList(countBy(pageViews, (e) => e.path)),
    topDestinations: toTopList(
      countBy(searches, (e) => e.payload?.term?.toLowerCase()),
    ),
    topListings: toTopList(countBy(listingViews, (e) => e.payload?.title)),
    recentEvents: events.slice(-10).reverse(),
  };
};

const CATEGORY_KEYWORDS = ['heritage', 'beach', 'nature', 'adventure', 'religious'];
const REGION_KEYWORDS = ['north', 'south', 'east', 'west', 'north east', 'northeast'];

const normalizeTerm = (term) => term?.toLowerCase().trim();

const extractSignalsFromTerms = (terms = []) => {
  const categories = new Set();
  const regions = new Set();

  terms.forEach((term) => {
    const normalized = normalizeTerm(term);
    if (!normalized) return;
    CATEGORY_KEYWORDS.forEach((cat) => {
      if (normalized.includes(cat)) categories.add(cat);
    });
    REGION_KEYWORDS.forEach((reg) => {
      if (normalized.includes(reg)) regions.add(reg);
    });
  });

  return {
    categories: Array.from(categories),
    regions: Array.from(regions),
  };
};

export const getPersonalizationSignals = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  const events = raw ? JSON.parse(raw) : [];
  const searches = events.filter((e) => e.type === 'search');
  const suggestionSelects = events.filter((e) => e.type === 'suggestion_select');
  const tourismClicks = events.filter((e) => e.type === 'tourism_click');

  const termCounts = {
    ...countBy(searches, (e) => e.payload?.term?.toLowerCase()),
    ...countBy(suggestionSelects, (e) => e.payload?.label?.toLowerCase()),
    ...countBy(tourismClicks, (e) => e.payload?.name?.toLowerCase()),
  };

  const topTerms = toTopList(termCounts, 8)
    .map((item) => item.label)
    .filter(Boolean);

  const { categories, regions } = extractSignalsFromTerms(topTerms);

  return {
    terms: topTerms,
    categories,
    regions,
  };
};
