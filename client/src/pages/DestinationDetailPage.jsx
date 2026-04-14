import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '@/utils/axios';
import { trackEvent } from '@/utils/analytics';

const createFallbackImage = (label) =>
  `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0B1220"/>
          <stop offset="100%" stop-color="#1F2937"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="800" fill="url(#bg)"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#E5E7EB" font-size="44" font-family="Arial, sans-serif">${label}</text>
    </svg>
  `)}`;

const FALLBACK_HERO_IMAGE = createFallbackImage('Beautiful Destination');
const FALLBACK_CARD_IMAGE = createFallbackImage('Destination');
const FALLBACK_THUMB_IMAGE = createFallbackImage('Photo');

const slugify = (value = '') =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const normalizeImageUrl = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'object') {
    return String(value.url || value.src || value.image || '').trim() || null;
  }
  return null;
};

const toImageCandidates = (url) => {
  const clean = normalizeImageUrl(url);
  if (!clean || !/^https?:\/\//i.test(clean)) return [];

  if (/upload\.wikimedia\.org/i.test(clean)) {
    const fileName = clean.split('/').pop()?.split('?')[0]?.split('#')[0];
    const filePath = fileName
      ? `https://commons.wikimedia.org/wiki/Special:FilePath/${fileName}`
      : null;
    return filePath ? [filePath, clean] : [clean];
  }

  return [clean];
};

const isLikelyPlaceholder = (url = '') => {
  const val = String(url).toLowerCase();
  return (
    val.startsWith('data:image/svg+xml') ||
    val.includes('/local-destination-images/') ||
    val.includes('placeholder')
  );
};

const isRandomHost = (url = '') => /picsum\.photos|loremflickr\.com/i.test(String(url));

const isRelevantToPlace = (url = '', place = {}) => {
  const hay = decodeURIComponent(String(url || '').toLowerCase());
  const title = String(place?.title || place?.name || place?.Destination_Name || '').toLowerCase();
  const state = String(place?.state || place?.State || '').toLowerCase();
  const tokens = title.split(/[^a-z0-9]+/).filter((t) => t.length >= 4).slice(0, 3);
  const stateTokens = state.split(/[^a-z0-9]+/).filter((t) => t.length >= 4).slice(0, 2);
  return [...tokens, ...stateTokens].some((t) => hay.includes(t));
};

const getLocalCandidates = (place = {}, localImageMap = {}, realImageMap = {}) => {
  const title = place.title || place.name || place.Destination_Name || '';
  const state = place.state || place.State || place.address?.split(',')?.[1]?.trim() || '';
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
  const title = String(place?.title || place?.name || place?.Destination_Name || 'Destination')
    .replace(/[<&>]/g, '')
    .slice(0, 44);

  return `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns='http://www.w3.org/2000/svg' width='1600' height='900' viewBox='0 0 1600 900'>
      <defs>
        <linearGradient id='bg' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0%' stop-color='#070D1F'/>
          <stop offset='100%' stop-color='#193754'/>
        </linearGradient>
      </defs>
      <rect width='1600' height='900' fill='url(#bg)'/>
      <circle cx='1260' cy='180' r='150' fill='#14B8A6' opacity='0.2'/>
      <rect x='120' y='650' width='1360' height='170' rx='28' fill='rgba(255,255,255,0.06)' stroke='rgba(212,178,122,0.42)'/>
      <text x='170' y='745' fill='#D4B27A' font-size='64' font-family='Segoe UI, Arial' font-weight='700'>${title}</text>
    </svg>
  `)}`;
};

const buildImagePool = (place, localImageMap = {}, realImageMap = {}) => {
  const localCandidates = getLocalCandidates(place, localImageMap, realImageMap);

  const raw = [
    ...(Array.isArray(place?.photos) ? place.photos : []),
    ...(Array.isArray(place?.images) ? place.images : []),
    place?.photo,
    place?.image,
  ];

  const expanded = raw.flatMap((item) => toImageCandidates(item));

  const realFirst = [
    ...expanded.filter((url) => !isLikelyPlaceholder(url) && !isRandomHost(url) && isRelevantToPlace(url, place)),
    ...localCandidates
      .flatMap((item) => toImageCandidates(item))
      .filter((url) => !isLikelyPlaceholder(url) && !isRandomHost(url) && isRelevantToPlace(url, place)),
  ];

  const merged = [...new Set(realFirst.filter(Boolean))];
  return merged;
};

const pickPrimaryImage = (place, localImageMap = {}, realImageMap = {}) => {
  return buildImagePool(place, localImageMap, realImageMap)[0] || FALLBACK_CARD_IMAGE;
};

const parseProsCons = (description = '') => {
  const raw = String(description || '');
  const lower = raw.toLowerCase();

  const advantagesMatch = lower.includes('advantages:')
    ? raw.split(/advantages:/i)[1]?.split(/drawbacks:|cons:/i)[0]
    : null;
  const drawbacksMatch = lower.includes('drawbacks:')
    ? raw.split(/drawbacks:/i)[1]
    : (lower.includes('cons:') ? raw.split(/cons:/i)[1] : null);

  const toList = (chunk) =>
    String(chunk || '')
      .split(/\.|\n|;/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 4);

  const pros = toList(advantagesMatch);
  const cons = toList(drawbacksMatch);

  return {
    pros: pros.length ? pros : ['Scenic destination with strong travel potential', 'Good for curated offbeat experiences'],
    cons: cons.length ? cons : ['Plan transport and stay in advance during peak season'],
  };
};

const buildHotelSuggestions = (destination = {}) => {
  const destinationName = destination.title || destination.name || 'Destination';
  const state = destination.state || destination.State || destination.address?.split(',')?.[1]?.trim() || 'India';
  const budgetRange = String(destination.budget_range || '').trim();

  const [minRaw, maxRaw] = budgetRange.split('-').map((v) => Number(String(v || '').replace(/[^\d]/g, '')));
  const min = Number.isFinite(minRaw) ? minRaw : 1200;
  const max = Number.isFinite(maxRaw) ? maxRaw : Math.max(2800, min + 1800);
  const avg = Math.round((min + max) / 2);

  return [
    {
      name: `${destinationName} Heritage Retreat`,
      tier: 'Premium',
      approxPrice: Math.max(avg + 900, min + 1200),
      features: ['Breakfast included', 'Guided local experience', 'Airport/rail pickup support'],
    },
    {
      name: `${state} Boutique Residency`,
      tier: 'Mid-range',
      approxPrice: avg,
      features: ['Central access', 'Family rooms', 'Local cuisine options'],
    },
    {
      name: `${destinationName} Backpacker Stay`,
      tier: 'Budget',
      approxPrice: Math.max(min, 900),
      features: ['Clean essentials', 'Wi-Fi', 'Flexible check-in'],
    },
  ];
};

export default function DestinationDetailPage() {
  const { name } = useParams();
  const navigate = useNavigate();
  const [destination, setDestination] = useState(null);
  const [similarPlaces, setSimilarPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [realImageMap, setRealImageMap] = useState({});
  const [localImageMap, setLocalImageMap] = useState({});

  useEffect(() => {
    fetch('/assets/real-image-map.json')
      .then((res) => res.json())
      .then((payload) => setRealImageMap(payload?.map || {}))
      .catch(() => setRealImageMap({}));

    fetch('/assets/local-image-map.json')
      .then((res) => res.json())
      .then((payload) => setLocalImageMap(payload?.map || {}))
      .catch(() => setLocalImageMap({}));

    if (!name || name === 'undefined') {
      setError('No destination specified');
      setLoading(false);
      return;
    }
    fetchDestinationDetails();
    trackEvent('destination_view', { destination: name });
  }, [name]);

  const fetchDestinationDetails = async () => {
    if (!name || name === 'undefined') {
      setError('Invalid destination name');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Get destination from tourism data
      const response = await axiosInstance.get(`/tourism/destination/${encodeURIComponent(name)}`);
      setDestination(response.data.destination);

      // Get similar destinations
      if (response.data.destination) {
        const location = response.data.destination.address || '';
        const state = location.split(',')[1]?.trim() || '';
        
        if (state) {
          try {
            const similarResponse = await axiosInstance.get(`/tourism/region/${state}`);
            const similar = (similarResponse.data?.destinations || [])
              .filter(d => (d.title || d.Destination_Name) !== (response.data.destination.title || response.data.destination.Destination_Name))
              .slice(0, 3);
            setSimilarPlaces(similar);
          } catch (err) {
            console.log('Could not fetch similar places:', err);
          }
        }
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching destination:', err);
      setError('Destination not found');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B1220] via-[#111827] to-[#0B1220] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#C9A96E]"></div>
          <p className="text-[#E5E7EB] text-lg">Loading destination details...</p>
        </div>
      </div>
    );
  }

  if (error || !destination) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B1220] via-[#111827] to-[#0B1220] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-6">🗺️</div>
          <h2 className="text-3xl font-bold text-white mb-4">Destination Not Found</h2>
          <p className="text-[#E5E7EB]/70 mb-8">
            We couldn't find the destination you're looking for. Let's explore other amazing places!
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-gradient-to-r from-[#C9A96E] to-[#D4B896] text-[#0B1220] font-semibold rounded-xl hover:opacity-90 transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const photos = buildImagePool(destination, localImageMap, realImageMap);
  const hasPhotos = photos.length > 0;
  const destinationName = destination.title || destination.name || String(name || 'Destination');
  const destinationAddress =
    destination.address ||
    [destination.district, destination.state].filter(Boolean).join(', ') ||
    'India';
  const { pros, cons } = parseProsCons(destination.description || destination.extraInfo);
  const hotelSuggestions = buildHotelSuggestions(destination);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1220] via-[#111827] to-[#0B1220]">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0B1220]/80 backdrop-blur border-b border-white/10 px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[#E5E7EB] hover:text-[#C9A96E] transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span className="font-medium">Back</span>
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 text-sm text-[#E5E7EB] hover:text-[#C9A96E] transition"
          >
            Home
          </button>
        </div>
      </div>

      {/* Hero Section with Photo Gallery */}
      {hasPhotos && (
        <div className="relative">
          {/* Main Photo */}
          <div className="relative h-[60vh] md:h-[70vh] overflow-hidden">
            <img
              src={photos[activePhotoIndex]}
              alt={destinationName}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = FALLBACK_HERO_IMAGE;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            
            {/* Photo Navigation */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={() => setActivePhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1))}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full backdrop-blur transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
                <button
                  onClick={() => setActivePhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full backdrop-blur transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </>
            )}
            
            {/* Title Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
              <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
                  {destinationName}
                </h1>
                <div className="flex items-center gap-2 text-white/90 text-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  <span>{destinationAddress}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Photo Thumbnails */}
          {photos.length > 1 && (
            <div className="bg-[#0B1220] border-b border-white/10 py-4">
              <div className="max-w-7xl mx-auto px-4 md:px-8">
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#C9A96E] scrollbar-track-transparent">
                  {photos.map((photo, index) => (
                    <button
                      key={index}
                      onClick={() => setActivePhotoIndex(index)}
                      className={`flex-shrink-0 relative rounded-lg overflow-hidden transition ${
                        index === activePhotoIndex
                          ? 'ring-2 ring-[#C9A96E] scale-105'
                          : 'opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={photo}
                        alt={`${destinationName} - ${index + 1}`}
                        className="w-24 h-16 object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        {/* Description Section */}
        <div className="mb-12">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 md:p-8">
            <h2 className="text-3xl font-bold text-white mb-6">About This Destination</h2>
            <p className="text-[#E5E7EB]/90 text-lg leading-relaxed mb-6">
              {destination.description}
            </p>
            {destination.extraInfo && (
              <p className="text-[#E5E7EB]/70 leading-relaxed">
                {destination.extraInfo}
              </p>
            )}
          </div>
        </div>

        {/* Highlights & Amenities */}
        {(destination.perks?.length > 0 || destination.activities?.length > 0) && (
          <div className="mb-12">
            <div className="bg-gradient-to-br from-[#C9A96E]/10 to-[#6C5BA7]/10 backdrop-blur-sm rounded-2xl border border-[#C9A96E]/20 p-6 md:p-8">
              <h2 className="text-3xl font-bold text-white mb-6">✨ Experience Highlights</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(destination.perks?.length ? destination.perks : destination.activities || []).map((perk, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 bg-white/5 rounded-xl p-4 border border-white/10 hover:border-[#C9A96E]/40 transition"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C9A96E] to-[#D4B896] flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-[#0B1220]">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-[#E5E7EB] font-medium capitalize">{perk}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mb-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-emerald-300/20 bg-emerald-500/5 p-6">
            <h3 className="text-2xl font-semibold text-white mb-3">✅ Why visit</h3>
            <ul className="space-y-2 text-[#E5E7EB]/85">
              {pros.map((item, index) => (
                <li key={`pro-${index}`} className="text-sm">• {item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-amber-300/20 bg-amber-500/5 p-6">
            <h3 className="text-2xl font-semibold text-white mb-3">⚠️ Things to consider</h3>
            <ul className="space-y-2 text-[#E5E7EB]/85">
              {cons.map((item, index) => (
                <li key={`con-${index}`} className="text-sm">• {item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mb-12 rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8">
          <h2 className="text-3xl font-bold text-white mb-4">🛏️ Suggested hotel options</h2>
          <p className="text-[#E5E7EB]/70 mb-6">Curated by your selected destination budget and travel profile.</p>

          <div className="grid gap-4 md:grid-cols-3">
            {hotelSuggestions.map((hotel, index) => (
              <div key={`hotel-${index}`} className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="text-lg font-semibold text-white">{hotel.name}</div>
                <div className="mt-1 text-xs text-[#C9A96E]">{hotel.tier}</div>
                <div className="mt-2 text-sm text-[#E5E7EB]/85">Approx. ₹{Math.round(hotel.approxPrice)} / night</div>
                <div className="mt-2 text-xs text-[#E5E7EB]/70">
                  {hotel.features.join(' • ')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Travel Information */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-6">📍 Travel Information</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#6C5BA7] to-[#9B8B5A] flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">Location</h3>
                  <p className="text-[#E5E7EB]/80">{destinationAddress}</p>
                </div>
              </div>
            </div>

            {destination.maxGuests && (
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C9A96E] to-[#D4B896] flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-[#0B1220]">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">Ideal For</h3>
                    <p className="text-[#E5E7EB]/80">Groups up to {destination.maxGuests} guests</p>
                  </div>
                </div>
              </div>
            )}

            {destination.price && (
              <div className="bg-gradient-to-br from-[#C9A96E]/20 to-[#6C5BA7]/20 backdrop-blur-sm rounded-2xl border border-[#C9A96E]/30 p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C9A96E] to-[#D4B896] flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-[#0B1220]">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">Starting From</h3>
                    <p className="text-3xl font-bold text-[#C9A96E]">₹{destination.price}</p>
                    <p className="text-[#E5E7EB]/60 text-sm">per night</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Similar Destinations */}
        {similarPlaces.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-6">🌟 Similar Destinations</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {similarPlaces.map((place, index) => {
                const placeName = place.title || place.Destination_Name || 'Destination';
                const placeAddress = place.address || place.State || '';
                const placePhoto = pickPrimaryImage(place, localImageMap, realImageMap);
                
                return (
                  <div
                    key={index}
                    onClick={() => navigate(`/destination/${encodeURIComponent(placeName)}`)}
                    className="group cursor-pointer bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-[#C9A96E]/40 transition-all duration-300 hover:shadow-xl hover:shadow-[#C9A96E]/10 hover:scale-105"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={placePhoto}
                        alt={placeName}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = FALLBACK_CARD_IMAGE;
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    </div>
                    <div className="p-5">
                      <h3 className="text-xl font-semibold text-white mb-2 line-clamp-1 group-hover:text-[#C9A96E] transition">
                        {placeName}
                      </h3>
                      <p className="text-[#E5E7EB]/70 text-sm line-clamp-1">
                        📍 {placeAddress}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-br from-[#6C5BA7]/20 to-[#C9A96E]/20 backdrop-blur-sm rounded-2xl border border-white/10 p-8 md:p-12">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Explore {destinationName}?
            </h2>
            <p className="text-[#E5E7EB]/80 text-lg mb-8">
              Discover more hidden gems and plan your perfect journey across India's offbeat destinations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/explore')}
                className="px-8 py-4 bg-gradient-to-r from-[#C9A96E] to-[#D4B896] text-[#0B1220] font-semibold rounded-xl hover:opacity-90 transition shadow-lg"
              >
                Explore More Destinations
              </button>
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('open-chatbot'));
                }}
                className="px-8 py-4 bg-white/5 text-white font-semibold rounded-xl border border-white/20 hover:bg-white/10 transition"
              >
                Ask Our Travel Bot
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

