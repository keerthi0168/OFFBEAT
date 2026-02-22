import React, { useEffect, useState } from 'react';
import axiosInstance from '@/utils/axios';
import InfoCard from './InfoCard';

const RecommendationsSection = ({ currentPlaceId, userId }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('personalized');

  useEffect(() => {
    loadRecommendations();
  }, [currentPlaceId, userId]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      let data;

      if (currentPlaceId) {
        // Show similar properties when viewing a specific property
        const response = await axiosInstance.get(`/recommendations/similar/${currentPlaceId}`);
        data = response.data.similar;
        setType('similar');
      } else if (userId) {
        // Show personalized recommendations for logged-in users
        const response = await axiosInstance.get('/recommendations/personalized');
        data = response.data.recommendations;
        setType(response.data.type || 'personalized');
      } else {
        // Show trending properties for guests
        const response = await axiosInstance.get('/recommendations/trending');
        data = response.data.trending;
        setType('trending');
      }

      setRecommendations(data || []);
    } catch (error) {
      console.error('Error loading recommendations:', error);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'similar':
        return '🎯 Similar Properties You Might Like';
      case 'personalized':
        return '✨ Recommended For You';
      case 'trending':
        return '🔥 Trending Properties';
      case 'popular':
        return '⭐ Popular Properties';
      default:
        return '🏡 You Might Also Like';
    }
  };

  if (loading) {
    return (
      <div className="mt-12">
        <h2 className="text-2xl font-light text-white mb-6">Loading recommendations...</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-light text-white">{getTitle()}</h2>
        {type === 'personalized' && (
          <span className="text-xs px-3 py-1 rounded-full bg-[#C9A96E]/10 text-[#C9A96E] border border-[#C9A96E]/20">
            AI Powered
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.slice(0, 6).map((place) => (
          <InfoCard key={place._id} place={place} />
        ))}
      </div>
    </div>
  );
};

export default RecommendationsSection;
