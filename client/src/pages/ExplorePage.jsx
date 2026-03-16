import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axiosInstance from '@/utils/axios';
import TourismDestinations from '@/components/ui/TourismDestinations';
import PlaceCard from '@/components/ui/PlaceCard';
import Spinner from '@/components/ui/Spinner';
import MLFeaturedListings from '@/components/ui/MLFeaturedListings';
import HiddenGemsSection from '@/components/ui/HiddenGemsSection';
import ClusterInsightsSection from '@/components/ui/ClusterInsightsSection';
import SimilarDestinationsSection from '@/components/ui/SimilarDestinationsSection';
import TravelPlannerSection from '@/components/ui/TravelPlannerSection';
import mlApi from '@/utils/mlApi';
import { trackEvent } from '@/utils/analytics';
import { getPersonalizationSignals } from '@/utils/analytics';

const ExplorePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [tourismResults, setTourismResults] = useState([]);
  const [propertyResults, setPropertyResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [rawDataset, setRawDataset] = useState(null);
  const [regionFilter, setRegionFilter] = useState('Any');

  const isAnyRegion = (value) => {
    const normalized = String(value || '').toLowerCase().trim();
    return normalized === 'any' || normalized === 'all' || normalized === 'all regions';
  };

  const matchesRegionFilter = (destination, selectedRegion) => {
    if (!selectedRegion || isAnyRegion(selectedRegion)) return true;
    const needle = String(selectedRegion).toLowerCase();
    const searchable = [
      destination.region,
      destination.direction,
      destination.state,
      destination.city,
      destination.address,
      destination.location,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return searchable.includes(needle);
  };

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
    if (!term && isAnyRegion(regionFilter)) return;

    setLoading(true);
    setHasSearched(true);

    try {
      if (!term && !isAnyRegion(regionFilter)) {
        const tourismResponse = await axiosInstance.get(
          `/tourism/region/${encodeURIComponent(regionFilter)}`,
        );
        setTourismResults(tourismResponse.data?.destinations || []);
        setPropertyResults([]);
        return;
      }

      if (term.length <= 2) {
        const [tourismResponse, propertyResponse] = await Promise.all([
          axiosInstance.get('/tourism/search', {
            params: {
              q: term,
            },
          }),
          axiosInstance.get(`/search/${encodeURIComponent(term)}`),
        ]);

        const tourismRaw = tourismResponse.data?.results || [];
        const filteredTourism = tourismRaw.filter((dest) =>
          matchesRegionFilter(dest, regionFilter),
        );

        setTourismResults(filteredTourism);
        setPropertyResults(propertyResponse.data || []);

        trackEvent('keyword_search', {
          term,
          region: regionFilter,
          results: filteredTourism.length,
          signals: getPersonalizationSignals(),
        });

        return;
      }

      const [semanticResponse, propertyResponse] = await Promise.all([
        mlApi.get('/semantic-search', {
          params: {
            query: term,
            region: regionFilter,
            limit: 10,
          },
        }),
        axiosInstance.get(`/search/${encodeURIComponent(term)}`),
      ]);

      let tourismRaw = semanticResponse.data?.results || [];
      let strategy = 'semantic';

      // Fallback to lexical search when semantic model returns no/very weak results.
      if (!tourismRaw.length) {
        const fallbackResponse = await axiosInstance.get('/tourism/search', {
          params: {
            q: term,
          },
        });

        tourismRaw = fallbackResponse.data?.results || [];
        strategy = 'lexical_fallback';
      }

      const filteredTourism = tourismRaw.filter((dest) =>
        matchesRegionFilter(dest, regionFilter),
      );

      setTourismResults(filteredTourism);
      setPropertyResults(propertyResponse.data || []);

      trackEvent('semantic_search', {
        term,
        region: regionFilter,
        results: filteredTourism.length,
        strategy,
        signals: getPersonalizationSignals(),
      });
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
        const response = await axiosInstance.get('/dataset/manifest');
        setRawDataset(response.data?.manifest || response.data);
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
                id="destination-search"
                name="destinationSearch"
                className="flex-1 rounded-full bg-transparent px-4 py-3 text-sm text-[#E5E7EB] placeholder-[#E5E7EB]/40 outline-none md:text-base"
                placeholder="Try place, city, state or UT (e.g., Daman, Goa, Kerala...)"
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
                id="region-filter"
                name="regionFilter"
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
                <option value="Any" className="bg-slate-800 text-white">All Regions</option>
                <option value="North" className="bg-slate-800 text-white">North India</option>
                <option value="South" className="bg-slate-800 text-white">South India</option>
                <option value="East" className="bg-slate-800 text-white">East India</option>
                <option value="West" className="bg-slate-800 text-white">West India</option>
                <option value="North East" className="bg-slate-800 text-white">North East India</option>
              </select>
              {!isAnyRegion(regionFilter) && (
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
            <p className="text-xs text-[#E5E7EB]/60">
              Tip: You can search by destination, district, state, or union territory name.
            </p>
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
                : 'No results found yet. Try a nearby spelling or search by state/UT (example: Daman, Diu, Dadra).'}
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
                      const destinationName =
                        dest.place_name || dest.title || dest.name || dest.Destination_Name || `Destination-${index + 1}`;
                      const imageUrl = getCategoryImage(
                        dest.type || dest.category || dest.Category || 'Nature',
                        destinationName,
                      );
                      return (
                        <div
                          key={index}
                          onClick={() => navigate(`/destination/${encodeURIComponent(destinationName)}`)}
                          className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 cursor-pointer hover:border-[#C9A96E]/50"
                        >
                          {imageUrl && (
                            <div className="h-48 overflow-hidden">
                              <img
                                src={imageUrl}
                                alt={destinationName}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          )}
                          <div className="p-6">
                            <h4 className="text-lg font-semibold text-white mb-2">
                              {destinationName}
                            </h4>
                            <p className="text-sm text-[#E5E7EB]/70 mb-3 line-clamp-2">
                              {dest.description || dest.info || 'Explore this beautiful destination'}
                            </p>
                            <div className="flex justify-between items-center">
                              <div className="text-xs text-[#C9A96E]">
                                {dest.state || dest.city || dest.location || dest.region || 'India'}
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-[#C9A96E] hover:text-[#D4B896] transition-colors">
                                  View info →
                                </div>
                                {typeof dest.semantic_similarity === 'number' && (
                                  <div className="text-[11px] text-[#E5E7EB]/50 mt-1">
                                    Match {(dest.semantic_similarity * 100).toFixed(0)}%
                                  </div>
                                )}
                              </div>
                            </div>
                            {(dest.predicted_category || dest.category) && (
                              <div className="mt-3 inline-flex items-center rounded-full border border-[#C9A96E]/25 bg-[#C9A96E]/10 px-2 py-1 text-[11px] text-[#C9A96E]">
                                Predicted: {dest.predicted_category || dest.category}
                              </div>
                            )}
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
                  className="group relative h-64 overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg cursor-pointer hover:border-[#C9A96E]/50 transition-all"
                  onClick={() => {
                    setRegionFilter('Any');
                    setQuery(category.category);
                    handleSearch(category.category);
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
            Machine learning recommendations based on the destination you search for.
          </p>
        </div>
        <MLFeaturedListings query={query} fallbackDestination="Goa" limit={5} />
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="space-y-3 mb-10">
          <h2 className="text-3xl font-light text-white tracking-tight">Similar Destinations (Cosine AI)</h2>
          <p className="text-lg text-[#E5E7EB]/60 font-light">
            Recommends similar destinations using category, rating, budget, and region with cosine similarity.
          </p>
        </div>
        <SimilarDestinationsSection initialRegion={regionFilter} />
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="space-y-3 mb-10">
          <h2 className="text-3xl font-light text-white tracking-tight">AI Travel Planner</h2>
          <p className="text-lg text-[#E5E7EB]/60 font-light">
            Enter budget, trip days, category, and region to generate a complete itinerary from the tourism dataset.
          </p>
        </div>
        <TravelPlannerSection initialRegion={regionFilter} />
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="space-y-3 mb-10">
          <h2 className="text-3xl font-light text-white tracking-tight">Hidden Gems</h2>
          <p className="text-lg text-[#E5E7EB]/60 font-light">
            Model-picked underrated destinations with strong ratings, lower popularity, and moderate budgets.
          </p>
        </div>
        <HiddenGemsSection region={regionFilter} limit={6} />
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="space-y-3 mb-10">
          <h2 className="text-3xl font-light text-white tracking-tight">Travel Clusters</h2>
          <p className="text-lg text-[#E5E7EB]/60 font-light">
            Unsupervised KMeans clusters for Budget travel, Luxury travel, Hidden gems, and Adventure travel.
          </p>
        </div>
        <ClusterInsightsSection region={regionFilter} limit={4} />
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
