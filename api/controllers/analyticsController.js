const User = require('../models/UserMySQL');

const MAX_EVENTS = 2000;
const MAX_PREF_ITEMS = 30;
const CATEGORY_KEYWORDS = ['heritage', 'beach', 'nature', 'adventure', 'religious'];
const REGION_KEYWORDS = ['north', 'south', 'east', 'west', 'north east', 'northeast'];

const analyticsStore = {
  events: [],
};

const pushEvent = (event) => {
  analyticsStore.events.push(event);
  if (analyticsStore.events.length > MAX_EVENTS) {
    analyticsStore.events.shift();
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

const toTopList = (counts, limit = 5) => {
  return Object.entries(counts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
};

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

const mergeUnique = (existing = [], additions = []) => {
  const combined = [...additions, ...existing]
    .map((item) => normalizeTerm(item))
    .filter(Boolean);
  return Array.from(new Set(combined)).slice(0, MAX_PREF_ITEMS);
};

const buildSignalsFromPayload = (payload = {}) => {
  const termSeeds = [
    payload.term,
    payload.label,
    payload.name,
    payload.title,
    payload.address,
    payload.state,
    payload.category,
    payload.region,
  ].filter(Boolean);

  const { categories, regions } = extractSignalsFromTerms(termSeeds);
  if (payload.category) categories.push(payload.category);
  if (payload.region) regions.push(payload.region);

  return {
    terms: termSeeds,
    categories,
    regions,
  };
};

const updateUserPreferences = async (userId, payload) => {
  try {
    const user = await User.findByPk(userId);
    if (!user) return;

    const existing = user.preferences || { terms: [], categories: [], regions: [] };
    const signals = buildSignalsFromPayload(payload);

    user.preferences = {
      terms: mergeUnique(existing.terms, signals.terms),
      categories: mergeUnique(existing.categories, signals.categories),
      regions: mergeUnique(existing.regions, signals.regions),
      updatedAt: new Date().toISOString(),
    };

    await user.save();
  } catch (error) {
    console.warn('Failed to update user preferences', error.message);
  }
};

exports.trackEvent = async (req, res) => {
  const { type, payload, path, referrer, userAgent, sessionId } = req.body || {};
  const event = {
    type: type || 'unknown',
    payload: payload || {},
    path: path || '',
    referrer: referrer || '',
    userAgent: userAgent || '',
    sessionId: sessionId || 'anonymous',
    timestamp: new Date().toISOString(),
  };
  pushEvent(event);

  const trackableTypes = new Set([
    'search',
    'suggestion_select',
    'tourism_click',
    'view_place',
  ]);

  if (payload?.userId && trackableTypes.has(event.type)) {
    await updateUserPreferences(payload.userId, payload);
  }

  res.status(200).json({ success: true });
};

exports.getSummary = (req, res) => {
  const events = analyticsStore.events;
  const pageViews = events.filter((e) => e.type === 'page_view');
  const searches = events.filter((e) => e.type === 'search');
  const listingViews = events.filter((e) => e.type === 'view_place');

  const topPages = toTopList(countBy(pageViews, (e) => e.path));
  const topDestinations = toTopList(
    countBy(searches, (e) => e.payload?.term?.toLowerCase()),
  );
  const topListings = toTopList(
    countBy(listingViews, (e) => e.payload?.title),
  );

  res.status(200).json({
    totalEvents: events.length,
    pageViews: pageViews.length,
    searches: searches.length,
    listingViews: listingViews.length,
    topPages,
    topDestinations,
    topListings,
    recentEvents: events.slice(-10).reverse(),
  });
};
