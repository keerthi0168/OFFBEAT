import React, { useState } from 'react';

import axiosInstance from '@/utils/axios';
import { usePlaces } from '../../../hooks';
import { trackEvent } from '@/utils/analytics';

const SearchBar = () => {
  const Places = usePlaces();
  const { setPlaces, setLoading } = Places;

  const [searchText, setSearchText] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);

  const handleSearch = async (e) => {
    clearTimeout(searchTimeout);
    const value = e?.target?.value ?? '';
    setSearchText(value);

    setLoading(true);
    setSearchTimeout(
      setTimeout(async () => {
        try {
          if (value.trimStart() === '') {
            const { data } = await axiosInstance.get('/places');
            setPlaces(data.places || []);
            trackEvent('search', { term: '', results: data.places?.length || 0 });
          } else {
            const { data } = await axiosInstance.get(
              `/search/${value.trimStart()}`,
            );
            setPlaces(data || []);
            trackEvent('search', { term: value.trimStart(), results: data?.length || 0 });
          }
        } catch (error) {
          console.error('Search failed', error);
        } finally {
          setLoading(false);
        }
      }, 500),
    );
  };

  return (
    <>
      <div className="flex w-4/6 overflow-hidden rounded-full border border-white/10 bg-white/5 backdrop-blur-md shadow-lg hover:shadow-xl md:w-1/2 transition-all duration-300">
        <div className="grow">
          <input
            type="search"
            id="header-search"
            name="header-search"
            placeholder="Search Indian destinations"
            className="h-full w-full border-none bg-transparent py-2 px-4 text-sm text-[#E5E7EB] placeholder-[#E5E7EB]/40 focus:outline-none md:text-base font-light"
            onChange={(e) => handleSearch(e)}
            value={searchText}
            autoComplete="off"
          />
        </div>
        <div className="flex cursor-pointer items-center">
          <button
            className="flex rounded-r-full bg-gradient-to-r from-[#C9A96E] to-[#D4B896] hover:from-[#D4B896] hover:to-[#E0C5A0] py-2 px-4 md:px-5 transition-all duration-300 text-[#0B1220] font-semibold"
            onClick={handleSearch}
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
    </>
  );
};

export default SearchBar;
