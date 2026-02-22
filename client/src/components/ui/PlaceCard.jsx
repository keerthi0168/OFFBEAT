import React from 'react';
import { Link } from 'react-router-dom';
import { trackEvent } from '@/utils/analytics';

const PlaceCard = ({ place }) => {
  const { _id: placeId, photos, address, title, price } = place;
  return (
    <Link
      to={`/place/${placeId}`}
      className="w-full"
      onClick={() => trackEvent('view_place', { id: placeId, title, address })}
    >
      <div className="group h-80 w-full flex flex-col rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden">
        {photos?.[0] && (
          <div className="relative h-full w-full overflow-hidden">
            <img
              src={photos[0]}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                e.currentTarget.src = '/assets/placeholder.svg';
              }}
              alt={address}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent" />
          </div>
        )}
        {!photos?.[0] && (
          <div className="h-full w-full bg-white/5 flex items-center justify-center">
            <span className="text-[#E5E7EB]/60">No image</span>
          </div>
        )}
      </div>
      <div className="px-2 py-3 space-y-1">
        <h2 className="truncate font-light text-[#E5E7EB] text-sm">{address}</h2>
        <h3 className="truncate text-xs text-[#E5E7EB]/50">{title}</h3>
        <div className="mt-2 text-sm">
          <span className="font-light text-[#C9A96E]">₹{price} </span>
          <span className="text-[#E5E7EB]/50">per night</span>
        </div>
      </div>
    </Link>
  );
};

export default PlaceCard;
