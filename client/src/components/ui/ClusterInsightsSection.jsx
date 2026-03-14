import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import mlApi, { getMlApiBaseUrl, getFriendlyMlError } from '@/utils/mlApi';

const clusterStyles = {
  'Budget travel': 'from-emerald-500/20 to-emerald-700/10 border-emerald-400/30',
  'Luxury travel': 'from-amber-500/20 to-orange-700/10 border-amber-400/30',
  'Hidden gems': 'from-fuchsia-500/20 to-violet-700/10 border-fuchsia-400/30',
  'Adventure travel': 'from-sky-500/20 to-cyan-700/10 border-sky-400/30',
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
        const response = await mlApi.get('/clusters', {
          params: {
            region,
            limit,
          },
        });

        if (ignore) return;
        setClusters(response.data?.clusters || []);
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
        <p className="mt-2 text-amber-100/60">
          AI service URL: <span className="font-mono">{getMlApiBaseUrl()}</span>
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