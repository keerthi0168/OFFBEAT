import React from 'react';

const PlaceImg = ({ place, index = 0, className = null }) => {
  const images = place.photos?.length ? place.photos : place.images?.length ? place.images : [];
  if (!images.length) {
    return '';
  }
  if (!className) {
    className = 'object-cover';
  }
  return (
    <img
      src={images[index]}
      alt=""
      className={className}
      onError={(e) => {
        e.currentTarget.src = '/assets/placeholder.svg';
      }}
    />
  );
};

export default PlaceImg;
