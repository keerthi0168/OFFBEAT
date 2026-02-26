import React from "react";

const Logo = () => (
  <div className="flex items-center gap-2">
    <svg className="h-8 w-8" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 5L5 15V25L20 35L35 25V15L20 5Z" fill="url(#gradient)" stroke="#6C5BA7" strokeWidth="2"/>
      <path d="M20 15L15 18V22L20 25L25 22V18L20 15Z" fill="white"/>
      <defs>
        <linearGradient id="gradient" x1="5" y1="5" x2="35" y2="35" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6C5BA7"/>
          <stop offset="1" stopColor="#9B8B5A"/>
        </linearGradient>
      </defs>
    </svg>
    <span className="text-2xl font-bold bg-gradient-to-r from-[#6C5BA7] to-[#9B8B5A] bg-clip-text text-transparent">Offbeat Travel India</span>
  </div>
);

export default Logo;