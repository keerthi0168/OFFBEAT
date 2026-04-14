import React, { useEffect, useState } from 'react';
import axiosInstance from '@/utils/axios';

const normalizeCandidates = (place) => {
  const direct = [
    ...(Array.isArray(place?.photos) ? place.photos : []),
    ...(Array.isArray(place?.images) ? place.images : []),
    place?.image,
  ]
    .filter(Boolean)
    .map((url) => String(url).trim())
    .filter((url) => /^https?:\/\//i.test(url));

  const expanded = direct.flatMap((url) => {
    if (/upload\.wikimedia\.org/i.test(url)) {
      const fileName = url.split('/').pop()?.split('?')[0]?.split('#')[0];
      const filePath = fileName
        ? `https://commons.wikimedia.org/wiki/Special:FilePath/${fileName}`
        : null;
      return filePath ? [filePath, url] : [url];
    }
    return [url];
  });

  return [...new Set(expanded)];
};

const RealImage = ({ candidates, alt, className }) => {
  const [index, setIndex] = useState(0);
  if (!candidates?.length) return null;
  if (index < 0 || index >= candidates.length) return null;

  return (
    <img
      src={candidates[index]}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => {
        setIndex((prev) => (prev + 1 < candidates.length ? prev + 1 : -1));
      }}
    />
  );
};

const HiddenPlacesGallery = () => {
  const [places, setPlaces] = useState([]);
  const [error, setError] = useState(null);
  const [visibleCount, setVisibleCount] = useState(24);

  useEffect(() => {
    const loadAll = async () => {
      try {
        const response = await axiosInstance.get('/tourism/all');
        const allPlaces = response.data?.destinations || [];

        const hiddenLike = allPlaces.filter((place) => {
          const popularity = String(place?.popularity || '').toLowerCase();
          const title = String(place?.title || place?.name || '').toLowerCase();
          const description = String(place?.description || '').toLowerCase();
          const info = String(place?.extraInfo || '').toLowerCase();
          return (
            popularity === 'low' ||
            popularity === 'medium' ||
            /hidden|offbeat|lesser|underrated|quiet|secluded/.test(`${title} ${description} ${info}`)
          );
        });

        const withRealImages = hiddenLike
          .map((place) => ({ ...place, _imageCandidates: normalizeCandidates(place) }))
          .filter((place) => place._imageCandidates.length > 0);

        const fallbackFromAll = allPlaces
          .map((place) => ({ ...place, _imageCandidates: normalizeCandidates(place) }))
          .filter((place) => place._imageCandidates.length > 0);

        const combined = [...withRealImages, ...fallbackFromAll];
        const deduped = [];
        const seen = new Set();
        for (const item of combined) {
          const key = String(item?.id || item?.title || item?.name || '').toLowerCase();
          if (!key || seen.has(key)) continue;
          seen.add(key);
          deduped.push(item);
        }

        setPlaces(deduped.slice(0, 320));
      } catch (err) {
        setError(err?.response?.data?.message || err.message);
      }
    };
    loadAll();
  }, []);

  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!places.length) return <div className="text-white">Loading hidden places from real dataset...</div>;

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <h2 className="text-3xl font-light text-white tracking-tight mb-2">Hidden Places Gallery</h2>
      <p className="text-[#E5E7EB]/70 mb-8">Showing {places.length}+ hidden/offbeat destinations from real tourism data.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {places.slice(0, visibleCount).map((place, idx) => (
          <div key={place.id || idx} className="bg-white/5 border border-white/10 rounded-2xl shadow-lg overflow-hidden flex flex-col">
            <RealImage candidates={place._imageCandidates} alt={place.name || place.title} className="w-full h-48 object-cover" />
            <div className="p-4 flex-1 flex flex-col">
              <h3 className="text-xl font-semibold text-[#C9A96E] mb-2">{place.name || place.title}</h3>
              <p className="text-white text-sm mb-2">{place.state || place.region || 'India'} {place.district ? `— ${place.district}` : ''}</p>
              <p className="text-[#E5E7EB]/80 text-xs mb-2">{place.description?.slice(0, 120)}...</p>
              <div className="flex flex-wrap gap-1 mt-auto">
                {place._imageCandidates?.slice(1, 5).map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt=""
                    className="w-10 h-10 object-cover rounded"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      {visibleCount < places.length && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => Math.min(prev + 24, places.length))}
            className="rounded-lg border border-[#C9A96E]/50 px-5 py-2 text-[#C9A96E] hover:bg-[#C9A96E]/10"
          >
            Load more hidden places
          </button>
        </div>
      )}
      <p className="text-[#C9A96E] mt-8 text-center">Total hidden places rendered: {places.length}</p>
    </section>
  );
};

export default HiddenPlacesGallery;
