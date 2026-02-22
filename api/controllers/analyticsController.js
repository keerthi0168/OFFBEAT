const MAX_EVENTS = 2000;

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

exports.trackEvent = (req, res) => {
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
