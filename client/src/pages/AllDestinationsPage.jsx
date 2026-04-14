

import React, { useEffect, useState } from "react";
import axios from "@/utils/axios";

const PAGE_SIZE = 24;

const AllDestinationsPage = () => {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchPlaces(page);
    // eslint-disable-next-line
  }, [page]);

  const fetchPlaces = async (pageNum) => {
    setLoading(true);
    try {
      const res = await axios.get("/dataset/manifest");
      const allPlaces = [];
      // Flatten all categories into a single array of places with images
      res.data.manifest.categories.forEach((cat) => {
        cat.files.forEach((file) => {
          allPlaces.push({
            name: file.name.replace(/-\d+\..+$/, ""),
            image: file.url,
            category: cat.category,
          });
        });
      });
      // Pagination
      const start = (pageNum - 1) * PAGE_SIZE;
      const end = start + PAGE_SIZE;
      setPlaces((prev) => (pageNum === 1 ? allPlaces.slice(start, end) : [...prev, ...allPlaces.slice(start, end)]));
      setHasMore(end < allPlaces.length);
    } catch (err) {
      setPlaces([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) setPage((p) => p + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6 text-center">All Destinations</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {places.map((destination, idx) => (
            <div
              key={idx}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              <a href={destination.image} target="_blank" rel="noopener noreferrer">
                <img
                  src={destination.image}
                  alt={destination.name}
                  className="w-full h-48 object-cover cursor-pointer"
                  loading="lazy"
                  onError={e => { e.target.onerror = null; e.target.src = '/assets/placeholder.jpg'; }}
                />
              </a>
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2">{destination.name}</h2>
                <p className="text-gray-500 text-xs">{destination.category}</p>
              </div>
            </div>
          ))}
        </div>
        {hasMore && (
          <div className="flex justify-center mt-8">
            <button
              onClick={handleLoadMore}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Loading..." : "Load More"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllDestinationsPage;
