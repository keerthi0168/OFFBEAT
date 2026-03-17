import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '@/utils/axios';
import { getFriendlyMlError } from '@/utils/mlApi';

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeGem = (place) => {
  const rating = toNumber(place?.rating, 4.2);
  const popularity = toNumber(place?.popularity_score, 60);
  const budget = toNumber(place?.price ?? place?.budgetMin ?? place?.budgetMax, 2200);

  const hiddenGemProbability = Math.min(
    1,
    Math.max(0, 0.55 * (rating / 5) + 0.35 * (1 - Math.min(popularity / 100, 1)) + 0.1 * (1 - Math.min(budget / 8000, 1)))
  );

  return {
    place_name: place?.title || place?.name || 'Destination',
    state: place?.state || place?.State || place?.address?.split(',')?.[1]?.trim() || 'India',
    region: place?.region || place?.direction || 'Any',
    category: place?.category || place?.type || 'Nature',
    rating,
    popularity_score: popularity,
    hidden_gem_probability: hiddenGemProbability,
    best_season: Array.isArray(place?.best_season)
      ? place.best_season.slice(0, 2).join(', ')
      : place?.best_season || 'Any',
    description: place?.description || place?.extraInfo || 'A peaceful destination worth exploring.',
  };
};

const HiddenGemsSection = ({ region = 'Any', limit = 6 }) => {
  const [gems, setGems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;

    const loadHiddenGems = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await axiosInstance.get('/tourism/all');

        const places = Array.isArray(response.data?.destinations) ? response.data.destinations : [];
        const regionLower = String(region || 'Any').toLowerCase();
        const filtered = places.filter((place) => {
          if (!regionLower || regionLower === 'any') return true;
          const placeRegion = String(place?.region || place?.direction || '').toLowerCase();
          return placeRegion.includes(regionLower);
        });

        const scored = filtered
          .map(normalizeGem)
          .sort((a, b) => b.hidden_gem_probability - a.hidden_gem_probability)
          .slice(0, limit);

        if (ignore) return;
        setGems(scored);
      } catch (requestError) {
        if (ignore) return;
        try {
          const fallbackResponse = await axiosInstance.get('/tourism/random', {
            params: { limit: Math.max(limit * 2, 10) },
          });
          const fallbackPlaces = Array.isArray(fallbackResponse.data?.destinations)
            ? fallbackResponse.data.destinations
            : [];

          const fallbackGems = fallbackPlaces
            .map(normalizeGem)
            .sort((a, b) => b.hidden_gem_probability - a.hidden_gem_probability)
            .slice(0, limit);

          if (ignore) return;
          setGems(fallbackGems);
          setError('');
        } catch (fallbackError) {
          if (ignore) return;
          setGems([]);
          setError(getFriendlyMlError(requestError, 'Hidden gem suggestions are not ready right now.'));
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadHiddenGems();

    return () => {
      ignore = true;
    };
  }, [region, limit]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: limit }).map((_, index) => (
          <div key={index} className="h-56 rounded-2xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-amber-400/20 bg-amber-500/5 p-6 text-sm text-amber-100">
        <div className="font-medium text-amber-200">Hidden gem suggestions are paused</div>
        <p className="mt-2 text-amber-100/80">{error}</p>
        <p className="mt-2 text-amber-100/60">
          You can still explore destinations normally.
        </p>
      </div>
    );
  }

  if (!gems.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-[#E5E7EB]/70">
        No hidden gems found right now. Try a different region filter.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {gems.map((gem) => (
        <Link
          key={`${gem.place_name}-${gem.state}`}
          to={`/destination/${encodeURIComponent(gem.place_name)}`}
          className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-[#C9A96E]/40 hover:shadow-xl"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-medium text-white group-hover:text-[#C9A96E]">
                {gem.place_name}
              </h3>
              <p className="mt-1 text-sm text-[#E5E7EB]/60">{gem.state} • {gem.region}</p>
            </div>
            <span className="rounded-full bg-[#C9A96E]/10 px-3 py-1 text-xs text-[#C9A96E] border border-[#C9A96E]/20">
              Hidden Gem
            </span>
          </div>

          <p className="mt-4 line-clamp-3 text-sm text-[#E5E7EB]/75">
            {gem.description}
          </p>

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[#E5E7EB]/60">{gem.category}</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[#E5E7EB]/60">Best in {gem.best_season}</span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 text-sm text-[#E5E7EB]/75">
            <div>
              <div className="text-[#C9A96E]">⭐ Rating</div>
              <div>{gem.rating?.toFixed?.(1) ?? gem.rating}</div>
            </div>
            <div>
              <div className="text-[#C9A96E]">🔥 Popularity</div>
              <div>{Math.round(gem.popularity_score)}</div>
            </div>
            <div>
              <div className="text-[#C9A96E]">💎 Score</div>
              <div>{(gem.hidden_gem_probability * 100).toFixed(0)}%</div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default HiddenGemsSection;