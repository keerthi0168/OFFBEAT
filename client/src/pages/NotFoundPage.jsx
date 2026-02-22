import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-2 py-40 bg-[#0B1220]">
      <div className="text-center max-w-lg">
        <p className="text-base font-semibold text-[#C9A96E]">404</p>
        <h1 className="mt-2 text-3xl font-light tracking-tight text-white sm:text-5xl">
          We can&apos;t seem to find the page you&apos;re looking for.
        </h1>
        <p className="mt-4 text-base leading-7 text-[#E5E7EB]/60 font-light">
          Sorry, the page you are looking for doesn't exist or has been moved.
        </p>
        <div className="mt-8 flex items-center justify-center gap-x-3">
          <Link to="/">
            <button className="rounded-2xl bg-gradient-to-r from-[#C9A96E] to-[#D4B896] p-3 px-20 hover:from-[#D4B896] hover:to-[#E0C5A0] transition-all duration-300 hover:-translate-y-0.5">
              <span className="font-semibold text-[#0B1220]">Go Home</span>
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
