import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axiosInstance from '@/utils/axios';
import TourismDestinations from '@/components/ui/TourismDestinations';
import PlaceCard from '@/components/ui/PlaceCard';
import Spinner from '@/components/ui/Spinner';
import { trackEvent } from '@/utils/analytics';
import { getPersonalizationSignals } from '@/utils/analytics';

const ExplorePage = () => {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [tourismResults, setTourismResults] = useState([]);
  const [propertyResults, setPropertyResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (value = query) => {
    const term = value.trim();
    if (!term) return;

    setLoading(true);
    setHasSearched(true);

    try {
      const [tourismResponse, propertyResponse] = await Promise.all([
        axiosInstance.post('/tourism/personalized', {
          query: term,
          signals: getPersonalizationSignals(),
          limit: 24,
        }),
        axiosInstance.get(`/search/${encodeURIComponent(term)}`),
      ]);

      setTourismResults(tourismResponse.data?.results || []);
      setPropertyResults(propertyResponse.data || []);
    } catch (error) {
      console.error('Explore search failed:', error);
      setTourismResults([]);
      setPropertyResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      handleSearch(q);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B1220] via-[#111827] to-[#1F8A8A]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-gradient-to-b from-[#C9A96E]/10 to-transparent rounded-full blur-3xl" />
        <div className="relative mx-auto flex min-h-[420px] max-w-6xl flex-col items-center justify-center px-6 py-24 text-center text-white">
          <h1 className="text-5xl font-light tracking-tight md:text-6xl">
            Explore India with AI Guidance
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-[#E5E7EB]/70 font-light">
            Search destinations, discover attractions, and find matching stays in one place.
          </p>
          <div className="mt-8 inline-flex w-full max-w-3xl items-center rounded-full border border-white/10 bg-white/5 p-3 backdrop-blur-md shadow-lg">
            <input
              className="flex-1 rounded-full bg-transparent px-4 py-3 text-sm text-[#E5E7EB] placeholder-[#E5E7EB]/40 outline-none md:text-base"
              placeholder="Search for destinations, states, attractions..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => (e.key === 'Enter' ? handleSearch() : null)}
            />
            <button
              className="rounded-full bg-gradient-to-r from-[#C9A96E] to-[#D4B896] px-6 py-3 text-sm font-semibold text-[#0B1220] hover:from-[#D4B896] hover:to-[#E0C5A0] transition-all duration-300"
              onClick={handleSearch}
            >
              Search
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="space-y-3 mb-10">
          <h2 className="text-3xl font-light text-white tracking-tight">Destination Explorer</h2>
          <p className="text-lg text-[#E5E7EB]/60 font-light">
            Curated places by category from our tourism dataset.
          </p>
        </div>

        <div className="space-y-12">
          <div>
            <h3 className="text-xl text-[#C9A96E] font-light mb-4">🏛️ Heritage</h3>
            <TourismDestinations category="Heritage" limit={6} />
          </div>
          <div>
            <h3 className="text-xl text-[#C9A96E] font-light mb-4">🏖️ Beach</h3>
            <TourismDestinations category="Beach" limit={6} />
          </div>
          <div>
            <h3 className="text-xl text-[#C9A96E] font-light mb-4">🌿 Nature</h3>
            <TourismDestinations category="Nature" limit={6} />
          </div>
          <div>
            <h3 className="text-xl text-[#C9A96E] font-light mb-4">⛰️ Adventure</h3>
            <TourismDestinations category="Adventure" limit={6} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="space-y-3 mb-10">
          <h2 className="text-3xl font-light text-white tracking-tight">Search Results</h2>
          <p className="text-lg text-[#E5E7EB]/60 font-light">
            Tourism insights and matching stays for your search.
          </p>
        </div>

        {loading && (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        )}

        {!loading && hasSearched && (
          <div className="space-y-12">
            <div>
              <h3 className="text-xl text-[#C9A96E] font-light mb-4">🗺️ Tourism Matches</h3>
              {tourismResults.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tourismResults.map((dest, idx) => (
                    <div
                      key={`${dest.name}-${idx}`}
                      className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5 hover:bg-white/10 transition"
                      onClick={() =>
                        trackEvent('tourism_click', {
                          name: dest.name,
                          state: dest.state,
                          category: dest.category,
                        })
                      }
                    >
                      <div className="text-lg text-white font-light">{dest.name}</div>
                      <div className="text-sm text-[#E5E7EB]/60 mt-1">
                        {dest.state} • {dest.category} • {dest.region}
                      </div>
                      <div className="text-sm text-[#E5E7EB]/70 mt-3">
                        ✨ {dest.attraction}
                      </div>
                      <div className="text-xs text-[#E5E7EB]/50 mt-2">
                        ✈️ {dest.airport}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-[#E5E7EB]/60">
                  No tourism matches found. Try another keyword.
                </div>
              )}
            </div>

            <div>
              <h3 className="text-xl text-[#C9A96E] font-light mb-4">🏠 Matching Stays</h3>
              {propertyResults.length ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {propertyResults.map((place) => (
                    <PlaceCard place={place} key={place._id} />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-[#E5E7EB]/60">
                  No matching stays found. Try another destination or city.
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default ExplorePage;
