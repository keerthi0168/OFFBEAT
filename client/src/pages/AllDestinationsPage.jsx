import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '@/utils/axios';
import { trackEvent } from '@/utils/analytics';

const AllDestinationsPage = () => {
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState([]);
  const [filteredDestinations, setFilteredDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDestinations();
    trackEvent('page_view', { page: 'all_destinations' });
  }, []);

  useEffect(() => {
    filterDestinations();
  }, [destinations, categoryFilter, regionFilter, searchQuery]);

  const fetchDestinations = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/tourism/all');
      setDestinations(response.data?.destinations || []);
      setFilteredDestinations(response.data?.destinations || []);
    } catch (error) {
      console.error('Error fetching destinations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterDestinations = () => {
    let filtered = [...destinations];

    // Filter by category
    if (categoryFilter !== 'All') {
      filtered = filtered.filter((dest) =>
        (dest.description || '').toLowerCase().includes(categoryFilter.toLowerCase()) ||
        (dest.perks || []).some(perk => perk.toLowerCase().includes(categoryFilter.toLowerCase()))
      );
    }

    // Filter by region
    if (regionFilter !== 'All') {
      filtered = filtered.filter((dest) =>
        (dest.address || '').toLowerCase().includes(regionFilter.toLowerCase())
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((dest) =>
        (dest.title || '').toLowerCase().includes(query) ||
        (dest.address || '').toLowerCase().includes(query) ||
        (dest.description || '').toLowerCase().includes(query)
      );
    }

    setFilteredDestinations(filtered);
  };

  const categories = ['All', 'Heritage', 'Beach', 'Nature', 'Adventure', 'Religious', 'Hill Station', 'Backwater'];
  const regions = ['All', 'North India', 'South India', 'East India', 'West India', 'North East India', 'Central India'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B1220] via-[#111827] to-[#0B1220] flex items-center justify-center">
        <div className="text-2xl text-[#E5E7EB]">Loading destinations...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1220] via-[#111827] to-[#0B1220] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 bg-gradient-to-r from-[#6C5BA7] to-[#C9A96E] bg-clip-text text-transparent">
            All Destinations
          </h1>
          <p className="text-[#E5E7EB]/70 text-lg">
            Explore {destinations.length} hidden gems across India
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            id="destinations-search"
            name="destinationsSearch"
            type="text"
            placeholder="Search destinations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/10 text-white placeholder-gray-400 focus:border-[#C9A96E] focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/20 backdrop-blur-sm transition"
          />
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          {/* Category Filter */}
          <div>
            <label className="block text-[#E5E7EB] mb-2 text-sm font-medium">Category</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setCategoryFilter(category)}
                  className={`px-4 py-2 rounded-lg transition ${
                    categoryFilter === category
                      ? 'bg-gradient-to-r from-[#6C5BA7] to-[#9B8B5A] text-white'
                      : 'bg-white/5 text-[#E5E7EB] hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Region Filter */}
          <div>
            <label className="block text-[#E5E7EB] mb-2 text-sm font-medium">Region</label>
            <div className="flex flex-wrap gap-2">
              {regions.map((region) => (
                <button
                  key={region}
                  onClick={() => setRegionFilter(region)}
                  className={`px-4 py-2 rounded-lg transition ${
                    regionFilter === region
                      ? 'bg-gradient-to-r from-[#6C5BA7] to-[#9B8B5A] text-white'
                      : 'bg-white/5 text-[#E5E7EB] hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-[#E5E7EB]/70">
          Showing {filteredDestinations.length} of {destinations.length} destinations
        </div>

        {/* Destinations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDestinations.map((destination, index) => (
            <div
              key={index}
              onClick={() => {
                trackEvent('destination_click', { title: destination.title });
                navigate(`/destination/${encodeURIComponent(destination.title)}`);
              }}
              className="group cursor-pointer bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-[#C9A96E]/40 transition-all duration-300 hover:shadow-xl hover:shadow-[#C9A96E]/10 hover:scale-105"
            >
              {/* Image */}
              <div className="relative h-56 overflow-hidden">
                <img
                  src={destination.photos?.[0] || 'https://via.placeholder.com/400x300?text=No+Image'}
                  alt={destination.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                {destination.price && (
                  <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg">
                    <span className="text-sm font-semibold text-gray-900">₹{destination.price}/night</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-xl font-semibold text-white mb-2 line-clamp-1">
                  {destination.title}
                </h3>
                <p className="text-[#E5E7EB]/70 text-sm mb-3 line-clamp-1">
                  📍 {destination.address}
                </p>
                <p className="text-[#E5E7EB]/60 text-sm line-clamp-2 mb-4">
                  {destination.description}
                </p>

                {/* Perks */}
                {destination.perks && destination.perks.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {destination.perks.slice(0, 3).map((perk, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-[#C9A96E]/10 text-[#C9A96E] text-xs rounded-lg border border-[#C9A96E]/20"
                      >
                        {perk}
                      </span>
                    ))}
                    {destination.perks.length > 3 && (
                      <span className="px-2 py-1 text-[#E5E7EB]/50 text-xs">
                        +{destination.perks.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredDestinations.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-semibold text-white mb-2">No destinations found</h3>
            <p className="text-[#E5E7EB]/70 mb-6">
              Try adjusting your filters or search query
            </p>
            <button
              onClick={() => {
                setCategoryFilter('All');
                setRegionFilter('All');
                setSearchQuery('');
              }}
              className="px-6 py-3 bg-gradient-to-r from-[#6C5BA7] to-[#9B8B5A] text-white rounded-lg hover:opacity-90 transition"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllDestinationsPage;
