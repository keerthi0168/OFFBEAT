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
  const [rawDataset, setRawDataset] = useState(null);
  const [regionFilter, setRegionFilter] = useState('Any');

  const getCategoryImage = (category, seed = '') => {
    if (!rawDataset?.categories?.length) return null;
    const categoryMap = {
      Beach: 'Beach',
      Heritage: 'Temple',
      Religious: 'Temple',
      Nature: 'Garden',
      Adventure: 'Hill Station',
      'National Park': 'National park',
      'Wildlife': 'National park',
    };
    const normalized = categoryMap[category] || category;
    const entry = rawDataset.categories.find(
      (cat) => cat.category.toLowerCase() === String(normalized).toLowerCase(),
    );
    if (!entry || !entry.files?.length) return null;
    const hash = Array.from(seed || category || '')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const index = entry.files.length ? hash % entry.files.length : 0;
    return entry.files[index]?.url || entry.files[0]?.url || null;
  };

  const handleSearch = async (value = query) => {
    const term = value.trim();
    if (!term && regionFilter === 'Any') return;

    setLoading(true);
    setHasSearched(true);

    try {
      if (!term && regionFilter !== 'Any') {
        const tourismResponse = await axiosInstance.get(
          `/tourism/region/${encodeURIComponent(regionFilter)}`,
        );
        setTourismResults(tourismResponse.data?.destinations || []);
        setPropertyResults([]);
        return;
      }

      const [tourismResponse, propertyResponse] = await Promise.all([
        axiosInstance.post('/tourism/personalized', {
          query: term,
          signals: getPersonalizationSignals(),
          limit: 24,
        }),
        axiosInstance.get(`/search/${encodeURIComponent(term)}`),
      ]);

      const tourismRaw = tourismResponse.data?.results || [];
      const filteredTourism =
        regionFilter === 'Any'
          ? tourismRaw
          : tourismRaw.filter(
              (dest) =>
                String(dest.region || dest.Region || '').toLowerCase() ===
                String(regionFilter).toLowerCase(),
            );

      setTourismResults(filteredTourism);
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

  useEffect(() => {
    const loadDataset = async () => {
      try {
        const response = await fetch('/assets/raw-dataset/manifest.json');
        if (!response.ok) return;
        const data = await response.json();
        setRawDataset(data);
      } catch (error) {
        console.warn('Failed to load raw dataset manifest', error);
      }
    };
    loadDataset();
  }, []);

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B1220] via-[#111827] to-[#1F8A8A]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-gradient-to-b from-[#C9A96E]/10 to-transparent rounded-full blur-3xl" />
        <div className="relative mx-auto flex min-h-[420px] max-w-6xl flex-col items-center justify-center px-6 py-24 text-center text-white">
          <h1 className="text-5xl font-light tracking-tight md:text-6xl">
            Discover Hidden India
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-[#E5E7EB]/70 font-light">
            Offbeat destinations, authentic experiences, personalized for you
          </p>
          <div className="mt-8 w-full max-w-3xl space-y-4">
            <div className="inline-flex w-full items-center rounded-full border border-white/10 bg-white/5 p-3 backdrop-blur-md shadow-lg">
              <input
                className="flex-1 rounded-full bg-transparent px-4 py-3 text-sm text-[#E5E7EB] placeholder-[#E5E7EB]/40 outline-none md:text-base"
                placeholder="Search hidden gems across India..."
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
            <div className="flex justify-center gap-3">
              <select
                className="rounded-full bg-white/5 border border-white/10 px-4 py-2 text-sm text-[#E5E7EB] outline-none cursor-pointer hover:bg-white/10 transition-colors backdrop-blur-md"
                value={regionFilter}
                onChange={(e) => {
                  const newRegion = e.target.value;
                  setRegionFilter(newRegion);
                  if (query || hasSearched) {
                    handleSearch(query);
                  }
                }}
              >
                <option value="Any">All Regions</option>
                <option value="North">North India</option>
                <option value="South">South India</option>
                <option value="East">East India</option>
                <option value="West">West India</option>
                <option value="Central">Central India</option>
                <option value="Northeast">Northeast India</option>
              </select>
              {regionFilter !== 'Any' && (
                <button
                  onClick={() => {
                    setRegionFilter('Any');
                    if (query) handleSearch(query);
                  }}
                  className="text-sm text-[#C9A96E] hover:text-[#D4B896] transition-colors"
                >
                  Clear filter
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {hasSearched && (
        <section className="mx-auto max-w-7xl px-6 py-16 border-t border-white/5">
          <div className="space-y-3 mb-10">
            <h2 className="text-3xl font-light text-white tracking-tight">Search Results</h2>
            <p className="text-lg text-[#E5E7EB]/60 font-light">
              {tourismResults.length + propertyResults.length > 0
                ? `Found ${tourismResults.length + propertyResults.length} results`
                : 'No results found. Try a different search term.'}
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="h-12 w-12 rounded-full border-4 border-[#C9A96E]/20 border-t-[#C9A96E] animate-spin"></div>
            </div>
          ) : (
            <>
              {tourismResults.length > 0 && (
                <div className="mb-12">
                  <h3 className="text-xl text-[#C9A96E] font-light mb-6">Tourism Destinations</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tourismResults.map((dest, index) => {
                      const imageUrl = getCategoryImage(
                        dest.type || dest.category || 'Nature',
                        dest.name || String(index),
                      );
                      return (
                        <div
                          key={index}
                          className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300"
                        >
                          {imageUrl && (
                            <div className="h-48 overflow-hidden">
                              <img
                                src={imageUrl}
                                alt={dest.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          )}
                          <div className="p-6">
                            <h4 className="text-lg font-semibold text-white mb-2">
                              {dest.name}
                            </h4>
                            <p className="text-sm text-[#E5E7EB]/70 mb-3 line-clamp-2">
                              {dest.description || dest.info || 'Explore this beautiful destination'}
                            </p>
                            <div className="flex justify-between items-center">
                              <div className="text-xs text-[#C9A96E]">
                                {dest.city || dest.location || dest.region || 'India'}
                              </div>
                              <a
                                href={`https://www.google.com/search?q=${encodeURIComponent(dest.name + ' India tourist destination')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-[#C9A96E] hover:text-[#D4B896] transition-colors"
                              >
                                View info →
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {propertyResults.length > 0 && (
                <div>
                  <h3 className="text-xl text-[#C9A96E] font-light mb-6">Hidden Places Gallery</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {propertyResults.map((place) => (
                      <PlaceCard key={place._id} place={place} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {rawDataset?.categories?.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="space-y-3 mb-10">
            <h2 className="text-3xl font-light text-white tracking-tight">Explore by Category</h2>
            <p className="text-lg text-[#E5E7EB]/60 font-light">
              Browse our collection of {rawDataset.categories.reduce((sum, cat) => sum + (cat.count || 0), 0)}+ authentic destination photographs.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rawDataset.categories.map((category) => {
              const preview = category.files?.[0]?.url;
              return (
                <div
                  key={category.slug}
                  className="group relative h-64 overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg cursor-pointer"
                  onClick={() => {
                    window.open(`https://www.google.com/search?q=${encodeURIComponent(category.category + ' tourist places in India')}`, '_blank');
                  }}
                >
                  {preview ? (
                    <img
                      src={preview}
                      alt={category.category}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-[#C9A96E]/20 to-transparent" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="text-xl font-light text-white">
                      {category.category}
                    </div>
                    <div className="text-sm text-[#C9A96E] mt-1">
                      {category.count} destinations
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="space-y-3 mb-10">
          <h2 className="text-3xl font-light text-white tracking-tight">Featured Listings</h2>
          <p className="text-lg text-[#E5E7EB]/60 font-light">
            Personalized recommendations based on your interests.
          </p>
        </div>
        <TourismDestinations personalized limit={6} />
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
    </div>
  );
};

export default ExplorePage;
