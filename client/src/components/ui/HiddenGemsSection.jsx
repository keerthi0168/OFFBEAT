import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import mlApi, { getMlApiBaseUrl, getFriendlyMlError } from '@/utils/mlApi';

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
        const response = await mlApi.get('/hidden-gems', {
          params: {
            region,
            limit,
          },
        });

        if (ignore) return;
        setGems(response.data?.results || []);
      } catch (requestError) {
        if (ignore) return;
        setGems([]);
        setError(getFriendlyMlError(requestError, 'Hidden gem suggestions are not ready right now.'));
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
        <p className="mt-2 text-amber-100/60">
          AI service URL: <span className="font-mono">{getMlApiBaseUrl()}</span>
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