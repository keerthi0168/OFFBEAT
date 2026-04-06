import React from 'react';

const PlaceImg = ({ place, index = 0, className = null }) => {
  // Always check both fields, fallback to empty array
  const images = Array.isArray(place.images) && place.images.length > 0
    ? place.images
    : (Array.isArray(place.photos) && place.photos.length > 0 ? place.photos : []);
  if (!images.length) {
    return (
      <img
        src={"/assets/placeholder.svg"}
        alt="No image available"
        className={className || "rounded-xl object-cover w-full h-full"}
      />
    );
  }
  return (
    <img
      src={images[index]}
      alt={place.name || place.title || "Destination"}
      className={className || "rounded-xl object-cover w-full h-full"}
      loading="lazy"
      onError={e => {
        e.currentTarget.src = '/assets/placeholder.svg';
      }}
    />
  );
};
