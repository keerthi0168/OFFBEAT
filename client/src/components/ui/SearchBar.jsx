import React, { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import axiosInstance from '@/utils/axios';
import { usePlaces } from '../../../hooks';
import { trackEvent } from '@/utils/analytics';
import {
  destinations,
  experiences,
  recommendationPool,
  uniqueStays,
} from '@/data/indiaTourismData';

const SearchBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const Places = usePlaces();
  const { setPlaces, setLoading } = Places;

  const [searchText, setSearchText] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const cacheRef = useRef({});

  const getLocalSuggestions = (query) => {
    const term = query.toLowerCase();
    const sources = [
      { type: 'destination', items: destinations },
      { type: 'stay', items: uniqueStays },
      { type: 'experience', items: experiences },
      { type: 'recommendation', items: recommendationPool },
    ];

    const results = [];

    sources.forEach((source) => {
      source.items.forEach((item) => {
        if (item.name && item.name.toLowerCase().includes(term)) {
          results.push({
            label: item.name,
            type: source.type,
            meta: item.price || item.region || item.interest,
          });
        }
      });
    });

    return results.slice(0, 6);
  };

  const buildSuggestions = ({ tourismResults, placeResults, query }) => {
    const tourismMatches = (tourismResults || []).map((dest) => ({
      label: dest.name,
      type: 'tourism',
      meta: `${dest.state} • ${dest.category}`,
    }));

    const placeMatches = (placeResults || []).map((place) => ({
      label: place.title || place.name || place.address || 'Place',
      type: 'place',
      id: place._id,
      meta: place.address || place.city || place.state,
    }));

    const localMatches = getLocalSuggestions(query);

    const combined = [...tourismMatches, ...placeMatches, ...localMatches];
    const seen = new Set();

    return combined.filter((item) => {
      const key = `${item.type}:${item.label}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const handleSearch = async (input) => {
    clearTimeout(searchTimeout);
    const value = typeof input === 'string' ? input : input?.target?.value ?? searchText;
    setSearchText(value);

    setLoading(true);
    setSearchTimeout(
      setTimeout(async () => {
        try {
          if (value.trim() === '') {
            const { data } = await axiosInstance.get('/places');
            setPlaces(data.places || []);
            setSuggestions([]);
            setShowSuggestions(false);
            trackEvent('search', { term: '', results: data.places?.length || 0 });
          } else {
            const query = value.trim();
            const cached = cacheRef.current[query];

            if (cached) {
              setPlaces(cached.placeResults || []);
              setSuggestions(cached.suggestions || []);
              setShowSuggestions(true);
              return;
            }

            setSuggesting(true);
            const encodedValue = encodeURIComponent(query);
            const [tourismResponse, placeResponse] = await Promise.all([
              axiosInstance.get(`/tourism/search?query=${encodedValue}&limit=6`),
              axiosInstance.get(`/search/${encodedValue}`),
            ]);

            const tourismResults = tourismResponse.data?.results || [];
            const placeResults = placeResponse.data || [];

            const nextSuggestions = buildSuggestions({
              tourismResults,
              placeResults,
              query,
            });

            setPlaces(placeResults);
            setSuggestions(nextSuggestions);
            setShowSuggestions(true);
            cacheRef.current[query] = {
              suggestions: nextSuggestions,
              placeResults,
            };

            trackEvent('search', { term: query, results: placeResults?.length || 0 });
          }
        } catch (error) {
          console.error('Search failed', error);
        } finally {
          setSuggesting(false);
          setLoading(false);
        }
      }, 500),
    );
  };

  const handleSuggestionSelect = (item) => {
    setSearchText(item.label);
    setShowSuggestions(false);

    trackEvent('suggestion_select', {
      label: item.label,
      type: item.type,
      meta: item.meta,
    });

    if (item.type === 'place' && item.id) {
      navigate(`/place/${item.id}`);
      return;
    }

    navigate(`/explore?q=${encodeURIComponent(item.label)}`);
  };

  return (
    <>
      <div className="relative w-4/6 md:w-1/2">
        <div className="flex overflow-hidden rounded-full border border-white/10 bg-white/5 backdrop-blur-md shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="grow">
            <input
              type="search"
              id="header-search"
              name="header-search"
              placeholder="Search Indian destinations"
              className="h-full w-full border-none bg-transparent py-2 px-4 text-sm text-[#E5E7EB] placeholder-[#E5E7EB]/40 focus:outline-none md:text-base font-light"
              onChange={handleSearch}
              onFocus={() => suggestions.length && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && searchText.trim()) {
                  navigate(`/explore?q=${encodeURIComponent(searchText.trim())}`);
                }
              }}
              value={searchText}
              autoComplete="off"
            />
          </div>
          <div className="flex cursor-pointer items-center">
            <button
              className="flex rounded-r-full bg-gradient-to-r from-[#C9A96E] to-[#D4B896] hover:from-[#D4B896] hover:to-[#E0C5A0] py-2 px-4 md:px-5 transition-all duration-300 text-[#0B1220] font-semibold"
              onClick={() => {
                if (searchText.trim()) {
                  navigate(`/explore?q=${encodeURIComponent(searchText.trim())}`);
                } else if (location.pathname !== '/') {
                  navigate('/');
                }
                handleSearch(searchText);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={3}
                stroke="currentColor"
                className="mt-1 h-4 w-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
              <span className="ml-1 hidden md:block text-sm">Search</span>
            </button>
          </div>
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#0B1220]/95 backdrop-blur-xl shadow-2xl">
            <div className="px-4 py-2 text-xs uppercase tracking-wide text-[#E5E7EB]/50">
              Suggestions {suggesting ? '• Loading' : ''}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {suggestions.map((item, index) => (
                <button
                  type="button"
                  key={`${item.type}-${item.label}-${index}`}
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-[#E5E7EB] hover:bg-white/5 transition"
                  onMouseDown={() => handleSuggestionSelect(item)}
                >
                  <div>
                    <div className="font-light">{item.label}</div>
                    {item.meta && (
                      <div className="text-xs text-[#E5E7EB]/50 mt-1">{item.meta}</div>
                    )}
                  </div>
                  <span className="text-xs text-[#C9A96E] capitalize">{item.type}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default SearchBar;
