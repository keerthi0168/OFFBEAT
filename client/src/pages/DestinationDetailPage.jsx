import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '@/utils/axios';
import Layout from '@/components/ui/Layout';

export default function DestinationDetailPage() {
  const { name } = useParams();
  const navigate = useNavigate();
  const [destination, setDestination] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDestinationDetails();
  }, [name]);

  const fetchDestinationDetails = async () => {
    try {
      setLoading(true);
      // Get destination from tourism data
      const response = await axiosInstance.get(`/tourism/destination/${name}`);
      setDestination(response.data.destination);

      // Get related properties
      const propsResponse = await axiosInstance.get(
        `/places?region=${response.data.destination.state}`
      );
      setProperties(propsResponse.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching destination:', err);
      setError('Destination not found');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <div className="text-xl text-gray-400">Loading destination details...</div>
        </div>
      </Layout>
    );
  }

  if (error || !destination) {
    return (
      <Layout>
        <div className="flex flex-col justify-center items-center h-screen gap-4">
          <div className="text-2xl text-red-400">{error || 'Destination not found'}</div>
          <button
            onClick={() => navigate('/explore')}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Back to Explore
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white px-4 py-8">
        <button
          onClick={() => navigate('/explore')}
          className="mb-6 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
        >
          ← Back to Explore
        </button>

        {/* Hero Section */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-4">{destination.name}</h1>
          <div className="flex gap-4 text-lg text-gray-300">
            <span>📍 {destination.state}</span>
            <span>🗺️ {destination.Region}</span>
            <span>🏷️ {destination.Category}</span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Left: Details */}
          <div className="bg-slate-700/50 backdrop-blur-sm rounded-xl p-6 border border-slate-600">
            <h2 className="text-2xl font-bold mb-4">About This Destination</h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-blue-400 mb-2">Region</h3>
                <p className="text-gray-300">{destination.Region}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-blue-400 mb-2">Category</h3>
                <p className="text-gray-300">{destination.Category}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-blue-400 mb-2">
                  Popular Attraction
                </h3>
                <p className="text-gray-300">{destination.attraction}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-blue-400 mb-2">Accessibility</h3>
                <p className="text-gray-300">{destination.accessibility}</p>
              </div>
            </div>
          </div>

          {/* Right: Travel Info */}
          <div className="bg-slate-700/50 backdrop-blur-sm rounded-xl p-6 border border-slate-600">
            <h2 className="text-2xl font-bold mb-4">Travel Information</h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-green-400 mb-2">
                  ✈️ Nearest Airport
                </h3>
                <p className="text-gray-300">{destination.airport}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-green-400 mb-2">
                  🚂 Nearest Railway Station
                </h3>
                <p className="text-gray-300">{destination.railway}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-yellow-400 mb-2">Pro Tips</h3>
                <ul className="text-gray-300 list-disc list-inside space-y-1">
                  <li>Best visited during peak season</li>
                  <li>Book accommodations in advance</li>
                  <li>Local guides recommended for tours</li>
                  <li>Check weather conditions before visiting</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Properties Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Available Properties in {destination.state}</h2>

          {properties.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <div
                  key={property._id}
                  className="bg-slate-700/50 backdrop-blur-sm rounded-lg overflow-hidden border border-slate-600 hover:border-blue-500 transition hover:shadow-lg hover:shadow-blue-500/20 cursor-pointer group"
                  onClick={() => navigate(`/place/${property._id}`)}
                >
                  {property.photos?.[0] && (
                    <img
                      src={property.photos[0]}
                      alt={property.title}
                      className="w-full h-40 object-cover group-hover:scale-105 transition"
                    />
                  )}

                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-2">{property.title}</h3>
                    <p className="text-gray-400 text-sm mb-3">{property.address}</p>

                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-2xl font-bold text-green-400">
                          ₹{property.price}
                        </p>
                        <p className="text-gray-400 text-xs">per night</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/place/${property._id}`);
                        }}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-700/30 rounded-lg">
              <p className="text-gray-400 mb-4">No properties found in this region yet</p>
              <button
                onClick={() => navigate('/places')}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition"
              >
                View All Properties
              </button>
            </div>
          )}
        </div>

        {/* Chatbot Integration */}
        <div className="bg-blue-900/30 border border-blue-500/30 rounded-xl p-6 mb-8">
          <h3 className="text-2xl font-bold mb-2">Need More Information?</h3>
          <p className="text-gray-300 mb-4">
            Ask our chatbot about {destination.name}, nearby attractions, best time to visit, or
            local cuisine!
          </p>
          <button
            onClick={() => {
              const chatWidget = document.querySelector('[data-chatbot-widget]');
              if (chatWidget) chatWidget.click();
            }}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition"
          >
            Ask Chatbot
          </button>
        </div>
      </div>
    </Layout>
  );
}
