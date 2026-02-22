import React, { useEffect, useState } from 'react';
import AccountNav from '@/components/ui/AccountNav';
import axiosInstance from '@/utils/axios';
import { getLocalSummary } from '@/utils/analytics';

const StatCard = ({ label, value }) => (
  <div className="rounded-2xl bg-white/5 backdrop-blur-md p-5 shadow-lg border border-white/10">
    <p className="text-sm text-[#E5E7EB]/60 font-light">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-[#C9A96E]">{value}</p>
  </div>
);

const TopList = ({ title, items }) => (
  <div className="rounded-2xl bg-white/5 backdrop-blur-md p-5 shadow-lg border border-white/10">
    <h3 className="text-lg font-semibold text-white">{title}</h3>
    <div className="mt-4 space-y-3">
      {items.length === 0 && (
        <p className="text-sm text-[#E5E7EB]/60 font-light">No data yet.</p>
      )}
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between">
          <span className="text-sm text-[#E5E7EB]/80 font-light">{item.label}</span>
          <span className="text-sm font-semibold text-[#C9A96E]">{item.value}</span>
        </div>
      ))}
    </div>
  </div>
);

const AdminDashboard = () => {
  const [summary, setSummary] = useState(getLocalSummary());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const { data } = await axiosInstance.get('/analytics/summary');
        setSummary(data);
      } catch (error) {
        setSummary(getLocalSummary());
      } finally {
        setLoading(false);
      }
    };
    loadSummary();
  }, []);

  return (
    <div className="min-h-screen bg-[#0B1220]">
      <AccountNav />
      <div className="mx-auto max-w-7xl px-6 pb-12 py-8">
        <div className="mb-8 space-y-2">
          <h1 className="text-4xl font-light text-white tracking-tight">Admin Analytics</h1>
          <p className="text-lg text-[#E5E7EB]/60 font-light">
            Track user journeys, popular destinations, and engagement trends.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Events" value={summary.totalEvents} />
          <StatCard label="Page Views" value={summary.pageViews} />
          <StatCard label="Searches" value={summary.searches} />
          <StatCard label="Listing Views" value={summary.listingViews} />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <TopList title="Top Pages" items={summary.topPages || []} />
          <TopList title="Top Destinations" items={summary.topDestinations || []} />
          <TopList title="Top Listings" items={summary.topListings || []} />
        </div>

        <div className="mt-8 rounded-2xl bg-white/5 backdrop-blur-md p-5 shadow-lg border border-white/10">
          <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
          {loading ? (
            <p className="mt-4 text-sm text-[#E5E7EB]/60 font-light">Loading analytics…</p>
          ) : summary.recentEvents?.length ? (
            <ul className="mt-4 space-y-2 text-sm text-[#E5E7EB]/80">
              {summary.recentEvents.map((event, index) => (
                <li key={`${event.timestamp}-${index}`} className="flex justify-between">
                  <span>{event.type}</span>
                  <span className="text-[#E5E7EB]/50">{new Date(event.timestamp).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-[#E5E7EB]/60 font-light">No recent events.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
