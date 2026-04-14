import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Spinner from '@/components/ui/Spinner';
import TourismDestinations from '@/components/ui/TourismDestinations';
import MLFeaturedListings from '@/components/ui/MLFeaturedListings';
import HiddenGemsSection from '@/components/ui/HiddenGemsSection';
import ClusterInsightsSection from '@/components/ui/ClusterInsightsSection';
import SimilarDestinationsSection from '@/components/ui/SimilarDestinationsSection';
import TravelPlannerSection from '@/components/ui/TravelPlannerSection';
import HiddenPlacesGallery from '@/components/ui/HiddenPlacesGallery';
import axiosInstance from '@/utils/axios';

const ExplorePage = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState('Any');
  const [allPlaces, setAllPlaces] = useState([]);
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(true);
  const [showHiddenGallery, setShowHiddenGallery] = useState(false);
  const [realImageMap, setRealImageMap] = useState({});
  const [localImageMap, setLocalImageMap] = useState({});

  const slugify = (value = '') =>
    String(value)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

  const getLocalCandidates = (place = {}) => {
    const title = place.title || place.name || '';
    const state = place.state || place.State || '';
    const slugTitle = slugify(title);
    const slugComposite = slugify(`${title}-${state}`);

    const keys = [
      place.id,
      title,
      `${title}|${state}`,
      slugTitle,
      slugComposite,
    ]
      .map((k) => String(k || '').trim().toLowerCase())
      .filter(Boolean);

    for (const key of keys) {
      if (Array.isArray(realImageMap[key]) && realImageMap[key].length) {
        return realImageMap[key];
      }
    }

    for (const key of keys) {
      if (Array.isArray(localImageMap[key]) && localImageMap[key].length) {
        return localImageMap[key];
      }
    }

    if (Array.isArray(realImageMap.__default) && realImageMap.__default.length) {
      return realImageMap.__default;
    }

    return Array.isArray(localImageMap.__default) ? localImageMap.__default : [];
  };

  const createInlineFallbackImage = (place = {}) => {
    const title = String(place?.title || place?.name || 'Destination').replace(/[<&>]/g, '').slice(0, 42);
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800' viewBox='0 0 1200 800'>
        <defs>
          <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
            <stop offset='0%' stop-color='#060B1E'/>
            <stop offset='100%' stop-color='#1A3456'/>
          </linearGradient>
        </defs>
        <rect width='1200' height='800' fill='url(#g)'/>
        <circle cx='950' cy='170' r='140' fill='#14B8A6' opacity='0.18'/>
        <rect x='80' y='580' width='1040' height='160' rx='24' fill='rgba(255,255,255,0.06)' stroke='rgba(212,178,122,0.45)'/>
        <text x='120' y='665' fill='#D4B27A' font-size='52' font-family='Segoe UI, Arial' font-weight='700'>${title}</text>
      </svg>
    `)}`;
  };

  useEffect(() => {
    fetch('/assets/real-image-map.json')
      .then((res) => res.json())
      .then((payload) => setRealImageMap(payload?.map || {}))
      .catch(() => setRealImageMap({}));

    fetch('/assets/local-image-map.json')
      .then((res) => res.json())
      .then((payload) => setLocalImageMap(payload?.map || {}))
      .catch(() => setLocalImageMap({}));

    const mergePlaces = (apiPlaces = [], localPlaces = []) => {
      const merged = [...apiPlaces, ...localPlaces];
      const seen = new Set();
      return merged.filter((place) => {
        const key = String(place.id || `${place.title || place.name}-${place.state || place.address || ''}`)
          .toLowerCase()
          .trim();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };

    setLoading(true);
    Promise.all([
      axiosInstance.get('/tourism/all').then((r) => (Array.isArray(r.data?.destinations) ? r.data.destinations : [])).catch(() => []),
      fetch('/assets/combined_hidden_places.json').then((res) => res.json()).then((d) => (Array.isArray(d) ? d : [])).catch(() => []),
    ])
      .then(([apiPlaces, localPlaces]) => {
        setAllPlaces(mergePlaces(apiPlaces, localPlaces));
      })
      .catch(() => setAllPlaces([]))
      .finally(() => setLoading(false));
  }, []);

  const normalizeImageCandidates = (place = {}) => {
    const inlineFallback = createInlineFallbackImage(place);
    const localCandidates = getLocalCandidates(place);

    const urls = [
      ...(Array.isArray(place.images) ? place.images : []),
      ...(Array.isArray(place.photos) ? place.photos : []),
      place.image,
    ]
      .filter(Boolean)
      .map((u) => String(u).trim())
      .filter((u) => /^https?:\/\//i.test(u));

    const expanded = urls.flatMap((u) => {
      if (/upload\.wikimedia\.org/i.test(u)) {
        const fileName = u.split('/').pop()?.split('?')[0]?.split('#')[0];
        const direct = fileName ? `https://commons.wikimedia.org/wiki/Special:FilePath/${fileName}` : null;
        return direct ? [u, direct] : [u];
      }
      return [u];
    });

    const query = [place.title || place.name, place.state, place.address, 'india', 'travel', 'landscape']
      .filter(Boolean)
      .join(' ');

    const seed = encodeURIComponent(String(place.id || place.name || 'destination'));
    const fallbackCandidates = [
      `https://picsum.photos/seed/${seed}/1600/900`,
      `https://picsum.photos/seed/${seed}-2/1600/900`,
      `https://picsum.photos/seed/${seed}-3/1600/900`,
      `https://loremflickr.com/1600/900/${encodeURIComponent('india,travel,landscape')}?lock=${seed}-a`,
      `https://loremflickr.com/1600/900/${encodeURIComponent('india,nature,heritage')}?lock=${seed}-b`,
    ];

    return [...new Set([inlineFallback, ...localCandidates, ...expanded, ...fallbackCandidates])];
  };

  useEffect(() => {
    const term = String(query || '').trim().toLowerCase();
    if (!term || term.length < 1) {
      setSuggestions([]);
      return;
    }

    const ranked = allPlaces
      .map((place) => {
        const title = String(place.title || place.name || '').trim();
        const state = String(place.state || '').trim();
        const district = String(place.district || '').trim();
        const hay = `${title} ${state} ${district}`.toLowerCase();
        let score = 0;
        if (title.toLowerCase() === term) score += 100;
        if (title.toLowerCase().startsWith(term)) score += 80;
        if (hay.includes(term)) score += 30;
        if (state.toLowerCase().startsWith(term)) score += 20;
        return score > 0 ? { place, score } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((item) => item.place);

    setSuggestions(ranked);
  }, [query, allPlaces]);

  const RealImage = ({ place, alt }) => {
    const candidates = useMemo(() => normalizeImageCandidates(place), [place]);
    const [index, setIndex] = useState(0);
    const [failedCount, setFailedCount] = useState(0);

    const fallbackSvg = `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800' viewBox='0 0 1200 800'>
        <defs>
          <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
            <stop offset='0%' stop-color='#050817'/>
            <stop offset='100%' stop-color='#121A33'/>
          </linearGradient>
        </defs>
        <rect width='1200' height='800' fill='url(#g)'/>
        <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#E5E7EB' font-size='48' font-family='Arial'>${String(alt || 'Destination')}</text>
      </svg>
    `)}`;

    if (!candidates.length) {
      return (
        <div className="h-64 w-full flex items-center justify-center bg-gray-800 text-gray-400">
          No image
        </div>
      );
    }

    return (
      <img
        src={failedCount >= candidates.length ? fallbackSvg : candidates[index]}
        alt={alt}
        className="w-full h-64 object-cover"
        loading="lazy"
        onError={() => {
          setFailedCount((prev) => prev + 1);
          setIndex((prev) => (prev + 1 < candidates.length ? prev + 1 : prev));
        }}
      />
    );
  };

  const handleSearch = (searchTerm = query) => {
    const term = String(searchTerm || '').trim().toLowerCase();
    if (!term) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);

    const filtered = allPlaces.filter((place) => {
      const text = [
        place.name,
        place.title,
        place.state,
        place.district,
        place.address,
        place.region,
        place.region_type,
        place.tourism_type,
        place.description,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const regionOk =
        regionFilter === 'Any' ||
        String(place.direction || '').toLowerCase() === String(regionFilter).toLowerCase();

      return text.includes(term) && regionOk;
    });

    setResults(filtered);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#010B24] pb-14">
      <section className="relative overflow-hidden border-b border-white/5 bg-[radial-gradient(110%_120%_at_45%_32%,rgba(255,255,255,0.15)_0%,rgba(2,6,23,0)_46%),radial-gradient(95%_130%_at_84%_92%,rgba(45,212,191,0.45)_0%,rgba(2,6,23,0.2)_46%,rgba(2,6,23,0.95)_80%),linear-gradient(180deg,#000F33_0%,#02102F_55%,#04122B_100%)]">
        <div className="pointer-events-none absolute -left-28 bottom-0 h-[22rem] w-[22rem] rounded-full bg-[#1E3A8A]/25 blur-[120px]" />
        <div className="pointer-events-none absolute right-0 bottom-0 h-[28rem] w-[28rem] rounded-full bg-[#14B8A6]/30 blur-[130px]" />

        <div className="mx-auto flex min-h-[62vh] w-full max-w-6xl flex-col items-center justify-center px-5 pb-14 pt-12 md:pt-14">
          <h1 className="text-center text-3xl font-light tracking-tight text-white md:text-5xl">
            Discover Hidden India
          </h1>
          <p className="mt-2 text-center text-sm font-light text-[#E5E7EB]/70 md:text-xl">
            Offbeat destinations, authentic experiences, personalized for you
          </p>

          <div className="relative mt-6 w-full max-w-5xl">
            <div className="flex items-center rounded-full border border-[#D4B27A]/35 bg-[rgba(15,23,42,0.58)] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_20px_55px_rgba(4,8,20,0.55)] backdrop-blur-xl">
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
              placeholder="Search destination, district, state..."
              className="h-12 flex-1 rounded-full bg-transparent px-5 text-base font-semibold text-white placeholder:text-[#E5E7EB]/60 outline-none md:h-14 md:px-7 md:text-xl"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
            />
            <button
              type="button"
              onClick={() => handleSearch()}
              className="h-12 rounded-full bg-[#D4B27A] px-6 text-base font-semibold text-[#1A1207] transition hover:brightness-105 md:h-14 md:px-8 md:text-xl"
            >
              Search
            </button>
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 rounded-2xl border border-white/10 bg-[#0B1220]/95 p-2 shadow-2xl backdrop-blur">
                {suggestions.map((place, idx) => {
                  const label = place.title || place.name || 'Destination';
                  const sub = [place.state, place.district].filter(Boolean).join(' — ');
                  return (
                    <button
                      key={`${label}-${idx}`}
                      type="button"
                      onClick={() => {
                        setQuery(label);
                        setShowSuggestions(false);
                        navigate(`/destination/${encodeURIComponent(label)}`);
                      }}
                      className="block w-full rounded-xl px-4 py-2 text-left hover:bg-white/5"
                    >
                      <div className="text-sm font-medium text-white">{label}</div>
                      <div className="text-xs text-[#E5E7EB]/65">{sub || 'India'}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-col items-center gap-2.5">
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="h-10 rounded-full border border-[#D4B27A]/35 bg-[rgba(30,41,59,0.62)] px-5 text-sm text-white outline-none backdrop-blur-md md:h-12 md:px-7 md:text-lg"
            >
              <option value="Any">All Regions</option>
              <option value="North">North</option>
              <option value="South">South</option>
              <option value="East">East</option>
              <option value="West">West</option>
            </select>

            <p className="text-xs text-[#E5E7EB]/55 md:text-sm">
              Tip: You can search by destination, district, state, or union territory name.
            </p>
          </div>
        </div>
      </section>

      {loading && (
        <div className="py-10 flex justify-center">
          <Spinner />
        </div>
      )}

      {hasSearched && !loading && (
        <section className="mx-auto max-w-7xl px-6 py-10">
          <h2 className="mb-2 text-2xl font-light text-white md:text-3xl">Search Results</h2>
          <p className="mb-5 text-base font-light text-[#E5E7EB]/75 md:text-xl">
            Found <span className="text-[#C9A96E]">{results.length}</span> results.
          </p>

          <div className="mb-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShowAdvancedFeatures((prev) => !prev)}
              className="rounded-full border border-[#C9A96E]/50 px-4 py-2 text-[#C9A96E] hover:bg-[#C9A96E]/10"
            >
              {showAdvancedFeatures ? 'Hide advanced features' : 'Show advanced features'}
            </button>

            <button
              type="button"
              onClick={() => setShowHiddenGallery((prev) => !prev)}
              className="rounded-full border border-[#C9A96E]/50 px-4 py-2 text-[#C9A96E] hover:bg-[#C9A96E]/10"
            >
              {showHiddenGallery ? 'Hide hidden places gallery' : 'Show hidden places gallery'}
            </button>
          </div>

          {results.length === 0 ? (
            <p className="text-gray-400">No results found.</p>
          ) : (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((item, idx) => (
                <article
                  key={item.id || item.name || idx}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-[rgba(15,23,42,0.62)] shadow-lg transition hover:border-[#C9A96E]/45"
                >
                  <RealImage place={item} alt={item.name || 'Destination'} />

                  <div className="p-5">
                    <button
                      type="button"
                      onClick={() => navigate(`/destination/${encodeURIComponent(item.title || item.name || '')}`)}
                      className="text-left"
                    >
                      <h3 className="text-xl font-bold text-white hover:text-[#C9A96E]">{item.title || item.name || 'Unnamed place'}</h3>
                    </button>
                    <p className="mt-1 text-xs text-gray-400">{item.state || 'India'}{item.district ? ` — ${item.district}` : ''}</p>
                    <p className="mt-3 line-clamp-3 text-sm text-gray-300">
                      {item.description || 'No description available.'}
                    </p>
                    {Array.isArray(item.activities) && item.activities.length > 0 && (
                      <p className="mt-2 line-clamp-1 text-xs text-[#E5E7EB]/65">
                        Hidden spots: {item.activities.slice(0, 3).join(' • ')}
                      </p>
                    )}
                    {(item.google_url || item.google_maps_url) && (
                      <a
                        href={item.google_url || item.google_maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-block text-xs text-[#C9A96E] hover:underline"
                      >
                        View on Google Maps
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => navigate(`/destination/${encodeURIComponent(item.title || item.name || '')}`)}
                      className="mt-3 inline-block text-xs text-[#C9A96E] hover:underline"
                    >
                      Open full details
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {showHiddenGallery && (
        <section className="mx-auto max-w-7xl px-6 py-10">
          <HiddenPlacesGallery />
        </section>
      )}

      {showAdvancedFeatures && (
        <>
          <section className="mx-auto max-w-7xl px-6 py-12">
            <div className="mb-8">
              <h2 className="text-3xl font-light text-white tracking-tight">Smart Similar Destinations</h2>
            </div>
            <SimilarDestinationsSection initialRegion={regionFilter} />
          </section>

          <section className="mx-auto max-w-7xl px-6 py-12">
            <div className="mb-8">
              <h2 className="text-3xl font-light text-white tracking-tight">AI Travel Planner</h2>
            </div>
            <TravelPlannerSection initialRegion={regionFilter} />
          </section>

          <section className="mx-auto max-w-7xl px-6 py-12">
            <div className="mb-8">
              <h2 className="text-3xl font-light text-white tracking-tight">Hidden Gems</h2>
            </div>
            <HiddenGemsSection region={regionFilter} limit={6} />
          </section>

          <section className="mx-auto max-w-7xl px-6 py-12">
            <div className="mb-8">
              <h2 className="text-3xl font-light text-white tracking-tight">Travel Clusters</h2>
            </div>
            <ClusterInsightsSection region={regionFilter} limit={4} />
          </section>

          <section className="mx-auto max-w-7xl px-6 py-12">
            <div className="mb-8">
              <h2 className="text-3xl font-light text-white tracking-tight">ML Featured Listings</h2>
            </div>
            <MLFeaturedListings region={regionFilter} limit={6} />
          </section>

          <section className="mx-auto max-w-7xl px-6 py-12">
            <div className="mb-8">
              <h2 className="text-3xl font-light text-white tracking-tight">Destination Explorer</h2>
              <p className="text-[#E5E7EB]/70 mt-2">Curated categories shown in compact batches.</p>
            </div>

            <div className="space-y-10">
              <div>
                <h3 className="text-xl text-[#C9A96E] font-light mb-4">🏛️ Heritage</h3>
                <TourismDestinations category="Heritage" limit={6} />
              </div>
              <div>
                <h3 className="text-xl text-[#C9A96E] font-light mb-4">🏖️ Beach</h3>
                <TourismDestinations category="Beach" limit={6} />
              </div>
              <div>
                <h3 className="text-xl text-[#C9A96E] font-light mb-4">🌿 Nature</h3>
                <TourismDestinations category="Nature" limit={6} />
              </div>
              <div>
                <h3 className="text-xl text-[#C9A96E] font-light mb-4">⛰️ Adventure</h3>
                <TourismDestinations category="Adventure" limit={6} />
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default ExplorePage;
