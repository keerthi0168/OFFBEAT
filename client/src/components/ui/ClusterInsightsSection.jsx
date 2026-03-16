import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '@/utils/axios';
import { getFriendlyMlError } from '@/utils/mlApi';

const clusterStyles = {
  'Budget travel': 'from-emerald-500/20 to-emerald-700/10 border-emerald-400/30',
  'Luxury travel': 'from-amber-500/20 to-orange-700/10 border-amber-400/30',
  'Hidden gems': 'from-fuchsia-500/20 to-violet-700/10 border-fuchsia-400/30',
  'Adventure travel': 'from-sky-500/20 to-cyan-700/10 border-sky-400/30',
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeDestination = (place) => ({
  place_name: place?.title || place?.name || 'Destination',
  state: place?.state || place?.State || place?.address?.split(',')?.[1]?.trim() || 'India',
  category: place?.category || place?.type || 'Nature',
  predicted_category: place?.category || place?.type || 'Nature',
  rating: toNumber(place?.rating, 4.2),
  budget: toNumber(place?.price ?? place?.budgetMin ?? place?.budgetMax, 2500),
  popularity_score: toNumber(place?.popularity_score, 55),
  region: place?.region || place?.direction || 'Any',
});

const pickClusterName = (destination) => {
  const category = String(destination.category || '').toLowerCase();
  const budget = toNumber(destination.budget, 2500);

  if (category.includes('adventure')) return 'Adventure travel';
  if (budget <= 1800) return 'Budget travel';
  if (budget >= 4500) return 'Luxury travel';
  if (toNumber(destination.popularity_score, 60) <= 40 || toNumber(destination.rating, 0) >= 4.7) {
    return 'Hidden gems';
  }
  return 'Budget travel';
};

const ClusterInsightsSection = ({ region = 'Any', limit = 4 }) => {
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;

    const loadClusters = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await axiosInstance.get('/tourism/all');
        const places = Array.isArray(response.data?.destinations) ? response.data.destinations : [];
        const regionLower = String(region || 'Any').toLowerCase();

        const normalized = places
          .map(normalizeDestination)
          .filter((destination) => {
            if (!regionLower || regionLower === 'any') return true;
            return String(destination.region || '').toLowerCase().includes(regionLower);
          })
          .map((destination) => ({
            ...destination,
            cluster_name: pickClusterName(destination),
          }));

        const grouped = new Map();
        for (const destination of normalized) {
          if (!grouped.has(destination.cluster_name)) {
            grouped.set(destination.cluster_name, []);
          }
          grouped.get(destination.cluster_name).push(destination);
        }

        const orderedClusters = ['Budget travel', 'Luxury travel', 'Hidden gems', 'Adventure travel']
          .map((clusterName) => {
            const items = grouped.get(clusterName) || [];
            if (!items.length) return null;

            const avgBudget = items.reduce((sum, item) => sum + toNumber(item.budget, 0), 0) / items.length;
            const avgRating = items.reduce((sum, item) => sum + toNumber(item.rating, 0), 0) / items.length;
            const avgPopularity = items.reduce((sum, item) => sum + toNumber(item.popularity_score, 0), 0) / items.length;

            return {
              cluster_name: clusterName,
              count: items.length,
              avg_budget: Number(avgBudget.toFixed(2)),
              avg_rating: Number(avgRating.toFixed(2)),
              avg_popularity: Number(avgPopularity.toFixed(2)),
              destinations: items
                .sort((a, b) => toNumber(b.rating, 0) - toNumber(a.rating, 0))
                .slice(0, limit),
            };
          })
          .filter(Boolean);

        if (ignore) return;
        setClusters(orderedClusters);
      } catch (requestError) {
        if (ignore) return;
        setClusters([]);
        setError(getFriendlyMlError(requestError, 'Travel insights are not ready right now.'));
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadClusters();

    return () => {
      ignore = true;
    };
  }, [region, limit]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-72 rounded-2xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-amber-400/20 bg-amber-500/5 p-6 text-sm text-amber-100">
        <div className="font-medium text-amber-200">Travel insights are paused</div>
        <p className="mt-2 text-amber-100/80">{error}</p>
        <p className="mt-2 text-amber-100/60">
          You can still continue browsing places.
        </p>
      </div>
    );
  }

  if (!clusters.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-[#E5E7EB]/70">
        No cluster insights found for the selected filters.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {clusters.map((cluster) => (
        <div
          key={cluster.cluster_name}
          className={`rounded-2xl border bg-gradient-to-br p-6 backdrop-blur-md ${clusterStyles[cluster.cluster_name] || 'from-white/5 to-white/0 border-white/10'}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-medium text-white">{cluster.cluster_name}</h3>
              <p className="mt-1 text-sm text-[#E5E7EB]/70">
                {cluster.count} destinations • Avg Rating {cluster.avg_rating} • Avg Budget ₹{Math.round(cluster.avg_budget)}
              </p>
            </div>
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-[#E5E7EB]/80">
              KMeans
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {(cluster.destinations || []).map((destination) => (
              <Link
                key={`${cluster.cluster_name}-${destination.place_name}`}
                to={`/destination/${encodeURIComponent(destination.place_name)}`}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 hover:border-[#C9A96E]/50 hover:bg-white/10 transition"
              >
                <div>
                  <div className="text-sm font-medium text-white">{destination.place_name}</div>
                  <div className="text-xs text-[#E5E7EB]/60">
                    {destination.state} • {destination.predicted_category || destination.category}
                  </div>
                </div>
                <div className="text-right text-xs text-[#C9A96E]">
                  <div>₹{Math.round(destination.budget)}</div>
                  <div>⭐ {destination.rating?.toFixed?.(1) ?? destination.rating}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ClusterInsightsSection;