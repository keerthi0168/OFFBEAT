import React, { useEffect, useState } from 'react';
import axiosInstance from '@/utils/axios';
import { getPersonalizationSignals } from '@/utils/analytics';

const TourismDestinations = ({ category, region, personalized = false, limit = 6 }) => {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rawDataset, setRawDataset] = useState(null);

  useEffect(() => {
    loadRawDataset();
    loadDestinations();
  }, [category, region, personalized]);

  const loadRawDataset = async () => {
    try {
      const response = await fetch('/assets/raw-dataset/manifest.json');
      if (!response.ok) return;
      const data = await response.json();
      setRawDataset(data);
    } catch (error) {
      console.warn('Failed to load raw dataset manifest', error);
    }
  };

  const getCategoryImage = (category, seed = '') => {
    if (!rawDataset?.categories?.length) return null;
    const categoryMap = {
      Beach: 'Beach',
      Heritage: 'Temple',
      Religious: 'Temple',
      Nature: 'Garden',
      Adventure: 'Hill Station',
      'National Park': 'National park',
      Wildlife: 'National park',
    };
    const normalized = categoryMap[category] || category;
    const entry = rawDataset.categories.find(
      (cat) => cat.category.toLowerCase() === String(normalized).toLowerCase(),
    );
    if (!entry || !entry.files?.length) return null;
    const hash = Array.from(seed || category || '').reduce(
      (acc, char) => acc + char.charCodeAt(0),
      0,
    );
    const index = entry.files.length ? hash % entry.files.length : 0;
    return entry.files[index]?.url || entry.files[0]?.url || null;
  };

  const loadDestinations = async () => {
    try {
      setLoading(true);
      let url = '/tourism/random?limit=' + limit;
      let method = 'get';
      let payload = null;
      
      if (personalized) {
        url = '/tourism/personalized';
        method = 'post';
        payload = {
          query: '',
          signals: getPersonalizationSignals(),
          limit,
        };
      } else if (category) {
        url = `/tourism/category/${category}`;
      } else if (region) {
        url = `/tourism/region/${region}`;
      }

      const { data } = await axiosInstance[method](url, payload);
      
      if (personalized) {
        setDestinations(data.results || []);
      } else if (category) {
        setDestinations(data.destinations || []);
      } else if (region) {
        setDestinations(data.destinations || []);
      } else {
        setDestinations(data.destinations || []);
      }
    } catch (error) {
      console.error('Error loading destinations:', error);
      setDestinations([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 rounded-2xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!destinations || destinations.length === 0) {
    return (
      <div className="text-center py-8 text-[#E5E7EB]/60">
        No destinations found
      </div>
    );
  }

  const getCategoryIcon = (cat) => {
    const icons = {
      'Heritage': '🏛️',
      'Beach': '🏖️',
      'Nature': '🌿',
      'Adventure': '⛰️',
      'Religious': '🕉️'
    };
    return icons[cat] || '📍';
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {destinations.slice(0, limit).map((dest, idx) => {
        const imageUrl = getCategoryImage(
          dest.category || dest.Category || 'Nature',
          dest.name || dest.Destination_Name || String(idx),
        );
        const destName = dest.name || dest.Destination_Name;
        const destState = dest.state || dest.State;
        const searchQuery = `${destName} ${destState} India tourist destination`;

        return (
          <a
            key={idx}
            href={`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all duration-300 hover:shadow-lg hover:shadow-[#C9A96E]/10 block"
          >
            {imageUrl && (
              <div className="h-48 overflow-hidden">
                <img
                  src={imageUrl}
                  alt={destName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
            
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white group-hover:text-[#C9A96E] transition">
                    {destName}
                  </h3>
                  <p className="text-sm text-[#E5E7EB]/60 mt-1">
                    {destState}
                  </p>
                </div>
                <span className="text-2xl">{getCategoryIcon(dest.category || dest.Category)}</span>
              </div>

              <div className="space-y-2 text-sm">
                {(dest.attraction || dest.Popular_Attraction) && (
                  <div className="flex items-center gap-2 text-[#E5E7EB]/80">
                    <span className="text-[#C9A96E]">✨</span>
                    <span className="line-clamp-1">{dest.attraction || dest.Popular_Attraction}</span>
                  </div>
                )}

                {(dest.category || dest.Category) && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-2 py-1 rounded-full bg-[#C9A96E]/10 text-[#C9A96E] border border-[#C9A96E]/20">
                      {dest.category || dest.Category}
                    </span>
                    {(dest.accessibility || dest.Accessibility) && (
                      <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-[#E5E7EB]/60">
                        {dest.accessibility || dest.Accessibility} Access
                      </span>
                    )}
                  </div>
                )}

                {(dest.airport || dest.Nearest_Airport) && (
                  <div className="text-xs text-[#E5E7EB]/50 mt-3 truncate">
                    ✈️ {dest.airport || dest.Nearest_Airport}
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center text-sm text-[#C9A96E] group-hover:text-[#D4B896]">
                <span>View details</span>
                <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
};

export default TourismDestinations;
