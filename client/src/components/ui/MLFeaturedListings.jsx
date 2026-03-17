import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '@/utils/axios';
import { getFriendlyMlError } from '@/utils/mlApi';

const categoryEmoji = {
  Heritage: '🏛️',
  Beach: '🏖️',
  Nature: '🌿',
  Adventure: '⛰️',
  Religious: '🕉️',
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeDestination = (place) => {
  const rating = toNumber(place?.rating, 4.2);
  const popularity = toNumber(place?.popularity_score, 55);
  const budget = toNumber(place?.price ?? place?.budgetMin ?? place?.budgetMax, 2500);

  return {
    place_name: place?.title || place?.name || 'Destination',
    state: place?.state || place?.State || place?.address?.split(',')?.[1]?.trim() || 'India',
    region: place?.region || place?.direction || 'Any',
    category: place?.category || place?.type || 'Nature',
    rating,
    popularity_score: popularity,
    budget,
    best_season: Array.isArray(place?.best_season)
      ? place.best_season.slice(0, 2).join(', ')
      : place?.best_season || 'Any',
    similarity: 0,
  };
};

const calculateSimilarity = (destination, query) => {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return 0.5;

  const name = String(destination.place_name || '').toLowerCase();
  const category = String(destination.category || '').toLowerCase();
  const region = String(destination.region || '').toLowerCase();

  if (name.startsWith(q)) return 0.97;
  if (name.includes(q)) return 0.9;
  if (category.includes(q) || region.includes(q)) return 0.75;
  return 0.55;
};

const MLFeaturedListings = ({ query, fallbackDestination = 'Goa', limit = 5 }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [matchedDestination, setMatchedDestination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const destinationQuery = useMemo(() => {
    const normalized = String(query || '').trim();
    return normalized || fallbackDestination;
  }, [query, fallbackDestination]);

  useEffect(() => {
    let ignore = false;

    const loadRecommendations = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await axiosInstance.get('/tourism/search', {
          params: {
            q: destinationQuery,
          },
        });

        if (ignore) return;

        const results = Array.isArray(response.data?.results) ? response.data.results : [];
        const normalized = results
          .map(normalizeDestination)
          .map((destination) => ({
            ...destination,
            similarity: calculateSimilarity(destination, destinationQuery),
          }))
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, limit);

        setRecommendations(normalized);
        setMatchedDestination(
          normalized[0]
            ? {
                place_name: normalized[0].place_name,
                state: normalized[0].state,
                category: normalized[0].category,
                best_season: normalized[0].best_season,
              }
            : null
        );
      } catch (requestError) {
        if (ignore) return;
        try {
          const fallbackResponse = await axiosInstance.get('/tourism/random', {
            params: { limit: Math.max(limit, 6) },
          });

          if (ignore) return;

          const fallbackResults = Array.isArray(fallbackResponse.data?.destinations)
            ? fallbackResponse.data.destinations
            : [];

          const normalizedFallback = fallbackResults
            .map(normalizeDestination)
            .map((destination) => ({
              ...destination,
              similarity: calculateSimilarity(destination, destinationQuery),
            }))
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit);

          setRecommendations(normalizedFallback);
          setMatchedDestination(
            normalizedFallback[0]
              ? {
                  place_name: normalizedFallback[0].place_name,
                  state: normalizedFallback[0].state,
                  category: normalizedFallback[0].category,
                  best_season: normalizedFallback[0].best_season,
                }
              : null
          );
          setError('');
        } catch (fallbackError) {
          if (ignore) return;
          setRecommendations([]);
          setMatchedDestination(null);
          setError(getFriendlyMlError(requestError, 'Smart recommendations are not ready right now.'));
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadRecommendations();

    return () => {
      ignore = true;
    };
  }, [destinationQuery, limit]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: limit }).map((_, index) => (
          <div key={index} className="h-64 rounded-2xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-amber-400/20 bg-amber-500/5 p-6 text-sm text-amber-100">
        <div className="font-medium text-amber-200">Smart recommendations are paused</div>
        <p className="mt-2 text-amber-100/80">{error}</p>
        <p className="mt-2 text-amber-100/60">
          You can still browse destinations below.
        </p>
      </div>
    );
  }

  if (!recommendations.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-[#E5E7EB]/70">
        No similar destinations found for <span className="text-[#C9A96E]">{destinationQuery}</span>.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {matchedDestination && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-[#E5E7EB]/70 backdrop-blur-md">
          Showing destinations similar to{' '}
          <span className="font-medium text-[#C9A96E]">{matchedDestination.place_name}</span>
          <span className="ml-2 text-[#E5E7EB]/50">
            {matchedDestination.state} • {matchedDestination.category} • Best in {matchedDestination.best_season}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {recommendations.map((destination) => (
          <Link
            key={`${destination.place_name}-${destination.state}`}
            to={`/destination/${encodeURIComponent(destination.place_name)}`}
            className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-[#C9A96E]/40 hover:shadow-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="line-clamp-2 text-lg font-medium text-white group-hover:text-[#C9A96E]">
                  {destination.place_name}
                </h3>
                <p className="mt-1 text-sm text-[#E5E7EB]/60">{destination.state}</p>
              </div>
              <span className="text-2xl">{categoryEmoji[destination.category] || '📍'}</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-[#C9A96E]/20 bg-[#C9A96E]/10 px-2 py-1 text-xs text-[#C9A96E]">
                {destination.category}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-[#E5E7EB]/60">
                {destination.region}
              </span>
            </div>

            <div className="mt-4 space-y-2 text-sm text-[#E5E7EB]/70">
              <div>⭐ Rating: {destination.rating ?? 'N/A'}</div>
              <div>🔥 Popularity: {destination.popularity_score ?? 'N/A'}</div>
              <div>💸 Budget: ₹{destination.budget ?? 'N/A'}</div>
              <div>🌤️ Best season: {destination.best_season}</div>
            </div>

            <div className="mt-4 text-sm text-[#C9A96E]">
              Similarity score: {(destination.similarity * 100).toFixed(1)}%
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MLFeaturedListings;