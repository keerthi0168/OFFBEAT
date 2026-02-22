import React, { useEffect, useState } from 'react';
import axiosInstance from '@/utils/axios';

const TourismDestinations = ({ category, region, limit = 6 }) => {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDestinations();
  }, [category, region]);

  const loadDestinations = async () => {
    try {
      setLoading(true);
      let url = '/tourism/random?limit=' + limit;
      
      if (category) {
        url = `/tourism/category/${category}`;
      } else if (region) {
        url = `/tourism/region/${region}`;
      }

      const { data } = await axiosInstance.get(url);
      
      if (category) {
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
      {destinations.slice(0, limit).map((dest, idx) => (
        <div
          key={idx}
          className="group rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5 hover:bg-white/10 transition-all duration-300 hover:shadow-lg hover:shadow-[#C9A96E]/10"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white group-hover:text-[#C9A96E] transition">
                {dest.name || dest.Destination_Name}
              </h3>
              <p className="text-sm text-[#E5E7EB]/60 mt-1">
                {dest.state || dest.State}
              </p>
            </div>
            <span className="text-2xl">{getCategoryIcon(dest.category || dest.Category)}</span>
          </div>

          <div className="space-y-2 text-sm">
            {(dest.attraction || dest.Popular_Attraction) && (
              <div className="flex items-center gap-2 text-[#E5E7EB]/80">
                <span className="text-[#C9A96E]">✨</span>
                <span>{dest.attraction || dest.Popular_Attraction}</span>
              </div>
            )}

            {(dest.category || dest.Category) && (
              <div className="flex items-center gap-2">
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
              <div className="text-xs text-[#E5E7EB]/50 mt-3">
                ✈️ {dest.airport || dest.Nearest_Airport}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TourismDestinations;
