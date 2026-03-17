import React, { useMemo, useState } from 'react';
import { fetchSimilarDestinations, getFriendlyMlError, trackMlInteraction } from '@/utils/mlApi';
import axiosInstance from '@/utils/axios';

const localSimilarityScore = (base = '', candidate = '') => {
  const a = String(base || '').trim().toLowerCase();
  const b = String(candidate || '').trim().toLowerCase();
  if (!a || !b) return 0.5;
  if (a === b) return 1;
  if (b.startsWith(a) || a.startsWith(b)) return 0.86;
  if (b.includes(a) || a.includes(b)) return 0.74;
  const aWords = new Set(a.split(/\s+/).filter(Boolean));
  const bWords = new Set(b.split(/\s+/).filter(Boolean));
  const overlap = [...aWords].filter((w) => bWords.has(w)).length;
  if (!aWords.size) return 0.5;
  return Math.min(0.92, Math.max(0.45, overlap / aWords.size));
};

const SimilarDestinationsSection = ({ initialRegion = 'Any' }) => {
  const [destination, setDestination] = useState('Goa');
  const [category, setCategory] = useState('');
  const [region, setRegion] = useState(initialRegion);
  const [rating, setRating] = useState('');
  const [budget, setBudget] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const hasFeatureFilters = useMemo(() => {
    return Boolean(category || (region && region !== 'Any') || rating || budget);
  }, [category, region, rating, budget]);

  const runSimilarity = async () => {
    setLoading(true);
    setError('');

    try {
      const params = {
        limit: 6,
        min_similarity: 0.45,
      };

      if (destination.trim()) {
        params.destination = destination.trim();
      } else if (hasFeatureFilters) {
        if (category) params.category = category;
        if (region && region !== 'Any') params.region = region;
        if (rating) params.rating = Number(rating);
        if (budget) params.budget = Number(budget);
      }

      const response = await fetchSimilarDestinations(params);
      if (!response?.success) {
        setError(response?.message || 'We could not fetch similar places right now.');
        setResults([]);
        return;
      }

      setResults(response.results || []);

      if (destination?.trim()) {
        await trackMlInteraction({
          user_id: 'explore_guest',
          event_type: 'search',
          query: destination.trim(),
        });
      }
    } catch (apiError) {
      try {
        const q = destination.trim() || category || 'India';
        const fallbackResponse = await axiosInstance.get('/tourism/search', {
          params: { q },
        });
        const fallbackRaw = Array.isArray(fallbackResponse.data?.results)
          ? fallbackResponse.data.results
          : [];

        const baseName = destination.trim() || q;
        const fallbackResults = fallbackRaw
          .map((item) => ({
            place_name: item.place_name || item.title || item.name || item.Destination_Name || 'Destination',
            category: item.category || item.type || 'Nature',
            region: item.region || item.direction || 'Any',
            rating: Number(item.rating) || 4.2,
            budget: Number(item.price ?? item.budgetMin ?? item.budgetMax) || 2200,
          }))
          .map((item) => ({
            ...item,
            cosine_similarity: localSimilarityScore(baseName, item.place_name),
          }))
          .filter((item) => item.place_name.toLowerCase() !== baseName.toLowerCase())
          .sort((a, b) => b.cosine_similarity - a.cosine_similarity)
          .slice(0, 6);

        setResults(fallbackResults);
        setError(fallbackResults.length ? '' : getFriendlyMlError(apiError, 'Similar destinations are not ready right now.'));
      } catch (fallbackError) {
        setError(getFriendlyMlError(apiError, 'Similar destinations are not ready right now.'));
        setResults([]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <p className="mb-4 text-sm text-[#E5E7EB]/75">
        Start with a place name (like <span className="text-[#C9A96E]">Goa</span>, <span className="text-[#C9A96E]">Daman</span>, or <span className="text-[#C9A96E]">Udaipur</span>). Optional filters can refine results.
      </p>
      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-5">
        <input
          id="similar-destination-input"
          name="destination"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Place name (e.g., Goa / Daman)"
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-[#E5E7EB]/40 outline-none"
        />
        <input
          id="similar-category-input"
          name="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Trip type (Beach, Heritage...)"
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-[#E5E7EB]/40 outline-none"
        />
        <select
          id="similar-region-select"
          name="region"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
        >
          <option value="Any" className="bg-slate-900">Any Region</option>
          <option value="North" className="bg-slate-900">North</option>
          <option value="South" className="bg-slate-900">South</option>
          <option value="East" className="bg-slate-900">East</option>
          <option value="West" className="bg-slate-900">West</option>
          <option value="North East" className="bg-slate-900">North East</option>
        </select>
        <input
          id="similar-rating-input"
          name="rating"
          value={rating}
          onChange={(e) => setRating(e.target.value)}
          type="number"
          min="1"
          max="5"
          step="0.1"
          placeholder="Min rating (1-5)"
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-[#E5E7EB]/40 outline-none"
        />
        <input
          id="similar-budget-input"
          name="budget"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          type="number"
          min="500"
          placeholder="Budget in ₹"
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-[#E5E7EB]/40 outline-none"
        />
      </div>

      <button
        onClick={runSimilarity}
        disabled={loading}
        className="rounded-full bg-gradient-to-r from-[#C9A96E] to-[#D4B896] px-5 py-2 text-sm font-semibold text-[#0B1220]"
      >
        {loading ? 'Finding matches...' : 'Find Similar Destinations'}
      </button>

      {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

      {!loading && !results.length && !error && (
        <p className="mt-4 text-sm text-[#E5E7EB]/70">Enter a place and click “Find Similar Destinations”.</p>
      )}

      {results.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {results.map((item, index) => (
            <div key={`${item.place_name}-${index}`} className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h4 className="text-white font-medium">{item.place_name}</h4>
              <p className="mt-1 text-xs text-[#E5E7EB]/70">{item.category} • {item.region}</p>
              <div className="mt-2 text-xs text-[#C9A96E]">
                Similarity score: {((item.cosine_similarity || 0) * 100).toFixed(1)}%
              </div>
              <div className="mt-1 text-xs text-[#E5E7EB]/70">
                Rating {item.rating?.toFixed?.(1) || item.rating} • Budget ₹{Math.round(item.budget || 0)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SimilarDestinationsSection;
