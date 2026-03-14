import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import mlApi, { getMlApiBaseUrl, getFriendlyMlError } from '@/utils/mlApi';

const categoryEmoji = {
  Heritage: '🏛️',
  Beach: '🏖️',
  Nature: '🌿',
  Adventure: '⛰️',
  Religious: '🕉️',
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
        const response = await mlApi.get('/recommendations', {
          params: {
            destination: destinationQuery,
            limit,
          },
        });

        if (ignore) return;

        setRecommendations(response.data?.recommendations || []);
        setMatchedDestination(response.data?.matched_destination || null);
      } catch (requestError) {
        if (ignore) return;

        setRecommendations([]);
        setMatchedDestination(null);
        setError(getFriendlyMlError(requestError, 'Smart recommendations are not ready right now.'));
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
        <p className="mt-2 text-amber-100/60">
          AI service URL: <span className="font-mono">{getMlApiBaseUrl()}</span>
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