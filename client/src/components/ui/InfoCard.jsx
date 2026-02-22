import React from 'react';
import { Link } from 'react-router-dom';
import PlaceImg from './PlaceImg';

const InfoCard = ({ place }) => {
  return (
    <Link
      to={`/account/places/${place._id}`}
      className="my-3 flex cursor-pointer flex-col gap-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-4 transition-all hover:-translate-y-1 hover:shadow-xl md:flex-row"
      key={place._id}
    >
      <div className="flex w-full shrink-0 bg-white/5 sm:h-32 sm:w-32 ">
        <PlaceImg place={place} />
      </div>
      <div className="">
        <h2 className="text-lg md:text-xl font-light text-white">{place.title}</h2>
        <p className="line-clamp-3 mt-2 text-sm text-[#E5E7EB]/60 font-light">{place.description}</p>
      </div>
    </Link>
  );
};

export default InfoCard;
