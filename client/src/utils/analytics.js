import axiosInstance from '@/utils/axios';

const STORAGE_KEY = 'spacebook_analytics_events';
const SESSION_KEY = 'spacebook_session_id';

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
  const event = {
    type,
    payload,
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
