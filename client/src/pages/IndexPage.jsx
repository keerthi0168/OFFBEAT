import { useState } from 'react';
import axiosInstance from '@/utils/axios';
import { usePlaces } from '../../hooks';
import Spinner from '@/components/ui/Spinner';
import PlaceCard from '@/components/ui/PlaceCard';
import {
  destinations,
  uniqueStays,
  experiences,
  recommendationPool,
} from '@/data/indiaTourismData';

const IndexPage = () => {
  const allPlaces = usePlaces();
  const { places, loading, setPlaces, setLoading } = allPlaces;
  const [filters, setFilters] = useState({
    budget: 'Any',
    interest: 'Any',
    season: 'Any',
    region: 'Any',
  });
  const [heroSearch, setHeroSearch] = useState('');

  const filteredRecommendations = recommendationPool.filter((item) => {
    if (filters.budget !== 'Any' && item.budget !== filters.budget) return false;
    if (filters.interest !== 'Any' && item.interest !== filters.interest) return false;
    if (filters.season !== 'Any' && item.season !== filters.season) return false;
    if (filters.region !== 'Any' && item.region !== filters.region) return false;
    return true;
  });

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B1220] via-[#111827] to-[#1F8A8A]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-b from-[#C9A96E]/10 to-transparent rounded-full blur-3xl" />
        <div className="relative mx-auto flex min-h-[520px] max-w-6xl flex-col items-center justify-center px-6 py-24 text-center text-white">
          <h1 className="text-5xl font-light tracking-tight md:text-6xl lg:text-7xl">
            Discover Hidden India with SpaceBook
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-[#E5E7EB]/70 font-light">
            Swadeshi travel that supports local guides, homestays, and MSMEs.
          </p>
          <div className="mt-8 inline-flex w-full max-w-3xl items-center rounded-full border border-white/10 bg-white/5 p-3 backdrop-blur-md shadow-lg">
            <input
              className="flex-1 rounded-full bg-transparent px-4 py-3 text-sm text-[#E5E7EB] placeholder-[#E5E7EB]/40 outline-none md:text-base"
              placeholder="Search hidden gems across India"
              value={heroSearch}
              onChange={(e) => setHeroSearch(e.target.value)}
              id="hero-search"
              name="hero-search"
              autoComplete="off"
            />
            <button
              className="rounded-full bg-gradient-to-r from-[#C9A96E] to-[#D4B896] px-6 py-3 text-sm font-semibold text-[#0B1220] hover:from-[#D4B896] hover:to-[#E0C5A0] transition-all duration-300"
              onClick={async () => {
                const term = heroSearch.trim();
                setLoading(true);
                try {
                  if (!term) {
                    const { data } = await axiosInstance.get('/places');
                    setPlaces(data.places || []);
                  } else {
                    const { data } = await axiosInstance.get(`/search/${term}`);
                    setPlaces(data || []);
                  }
                } catch (error) {
                  console.error('Hero search failed', error);
                } finally {
                  setLoading(false);
                }
              }}
            >
              Search
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="space-y-3 mb-12">
          <h2 className="text-4xl font-light text-white tracking-tight">Hidden Gems of India</h2>
          <p className="text-lg text-[#E5E7EB]/60 font-light">Curated escapes beyond the usual trail.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {destinations.map((dest) => (
            <div key={dest.name} className="group relative h-64 overflow-hidden rounded-2xl">
              <img
                src={dest.image}
                alt={dest.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = '/assets/placeholder.svg';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-lg font-light text-white">
                {dest.name}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="space-y-3 mb-12">
          <h2 className="text-4xl font-light text-white tracking-tight">Swadeshi Stays</h2>
          <p className="text-lg text-[#E5E7EB]/60 font-light">Homestays, eco-lodges, and local experiences.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {uniqueStays.map((stay) => (
            <div key={stay.name} className="group relative h-72 overflow-hidden rounded-2xl">
              <img
                src={stay.image}
                alt={stay.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = '/assets/placeholder.svg';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="text-lg font-light text-white">{stay.name}</div>
                <div className="text-sm text-[#C9A96E] font-light">{stay.price}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="space-y-3 mb-12">
          <h2 className="text-4xl font-light text-white tracking-tight">Signature Experiences</h2>
          <p className="text-lg text-[#E5E7EB]/60 font-light">Immersive journeys with local experts.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {experiences.map((exp) => (
            <div key={exp.name} className="group relative h-72 overflow-hidden rounded-2xl">
              <img
                src={exp.image}
                alt={exp.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = '/assets/placeholder.svg';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-lg font-light text-white">
                {exp.name}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="space-y-3 mb-12">
          <h2 className="text-4xl font-light text-white tracking-tight">Personalized Travel Plan</h2>
          <p className="text-lg text-[#E5E7EB]/60 font-light">
            Choose your preferences to get tailored recommendations across India.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 rounded-2xl bg-white/5 backdrop-blur-md p-4 shadow-lg border border-white/10 md:grid-cols-4">
          <select
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md px-3 py-2 text-sm text-[#E5E7EB] focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20 transition-all duration-300"
            value={filters.budget}
            onChange={(e) => setFilters((prev) => ({ ...prev, budget: e.target.value }))}
          >
            <option className="bg-[#0B1220] text-[#E5E7EB]">Any</option>
            <option className="bg-[#0B1220] text-[#E5E7EB]">Budget</option>
            <option className="bg-[#0B1220] text-[#E5E7EB]">Mid</option>
            <option className="bg-[#0B1220] text-[#E5E7EB]">Premium</option>
          </select>
          <select
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md px-3 py-2 text-sm text-[#E5E7EB] focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20 transition-all duration-300"
            value={filters.interest}
            onChange={(e) => setFilters((prev) => ({ ...prev, interest: e.target.value }))}
          >
            <option className="bg-[#0B1220] text-[#E5E7EB]">Any</option>
            <option className="bg-[#0B1220] text-[#E5E7EB]">Nature</option>
            <option className="bg-[#0B1220] text-[#E5E7EB]">Culture</option>
            <option className="bg-[#0B1220] text-[#E5E7EB]">Adventure</option>
            <option className="bg-[#0B1220] text-[#E5E7EB]">Wellness</option>
          </select>
          <select
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md px-3 py-2 text-sm text-[#E5E7EB] focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20 transition-all duration-300"
            value={filters.season}
            onChange={(e) => setFilters((prev) => ({ ...prev, season: e.target.value }))}
          >
            <option className="bg-[#0B1220] text-[#E5E7EB]">Any</option>
            <option className="bg-[#0B1220] text-[#E5E7EB]">Spring</option>
            <option className="bg-[#0B1220] text-[#E5E7EB]">Summer</option>
            <option className="bg-[#0B1220] text-[#E5E7EB]">Monsoon</option>
            <option className="bg-[#0B1220] text-[#E5E7EB]">Winter</option>
          </select>
          <select
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md px-3 py-2 text-sm text-[#E5E7EB] focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20 transition-all duration-300"
            value={filters.region}
            onChange={(e) => setFilters((prev) => ({ ...prev, region: e.target.value }))}
          >
            <option className="bg-[#0B1220] text-[#E5E7EB]">Any</option>
            <option className="bg-[#0B1220] text-[#E5E7EB]">North</option>
            <option className="bg-[#0B1220] text-[#E5E7EB]">South</option>
            <option className="bg-[#0B1220] text-[#E5E7EB]">East</option>
            <option className="bg-[#0B1220] text-[#E5E7EB]">West</option>
            <option className="bg-[#0B1220] text-[#E5E7EB]">North East</option>
          </select>
        </div>
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-lg">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filteredRecommendations.length ? (
              filteredRecommendations.map((item) => (
                <div key={item.name} className="group relative rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 overflow-hidden shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-40 w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.currentTarget.src = '/assets/placeholder.svg';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent" />
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="font-light text-[#E5E7EB]">{item.name}</div>
                    <div className="text-xs text-[#E5E7EB]/60 font-light">
                      {item.region} • {item.interest} • {item.season}
                    </div>
                    <div className="text-sm text-[#C9A96E] font-light">{item.budget}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full rounded-2xl bg-white/5 p-6 text-center text-sm text-[#E5E7EB]/60 shadow">
                No matches. Try changing filters.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="space-y-3 mb-12">
          <h2 className="text-4xl font-light text-white tracking-tight">Featured Listings</h2>
          <p className="text-lg text-[#E5E7EB]/60 font-light">Handpicked homes from exceptional local hosts</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-lg">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {loading ? (
              <div className="col-span-full flex w-full items-center justify-center py-10">
                <Spinner />
              </div>
            ) : places && places.length > 0 ? (
              places.map((place) => <PlaceCard place={place} key={place._id} />)
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-10">
                <p className="text-lg text-[#E5E7EB]/60 font-light">No listings available</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default IndexPage;
