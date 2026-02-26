import React, { useContext, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Logo from './Logo';
import SearchBar from './SearchBar';
import { UserContext } from '@/providers/UserProvider';

function Header() {
  const { user, logout } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const isSearchVisible = user && ['/', '/home', '/explore'].includes(location.pathname);

  const handleLogout = async () => {
    const response = await logout();
    if (response.success) {
      toast.success('Logged out successfully');
      setShowMenu(false);
      navigate('/');
    } else {
      toast.error(response.message || 'Logout failed');
    }
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between gap-4 border-b border-white/10 bg-[#0B1220]/80 backdrop-blur px-4 py-3 shadow-lg md:px-8">
      <Link to="/" className="flex items-center gap-1 hover:opacity-80 transition">
        <Logo />
      </Link>

      {isSearchVisible && (
        <div className="flex flex-1 items-center justify-center gap-4">
          <SearchBar />
          <Link
            to="/explore"
            className="hidden md:inline-flex items-center rounded-2xl border border-[#C9A96E]/40 bg-white/5 px-4 py-2 text-sm text-[#E5E7EB] font-light transition hover:bg-white/10"
          >
            Explore India
          </Link>
        </div>
      )}

      <div className="flex items-center gap-3">
        {!user && (
          <>
            <Link
              to="/login"
              className="rounded-2xl border border-[#C9A96E]/40 bg-white/5 px-4 py-2 text-sm text-[#E5E7EB] font-semibold transition hover:bg-white/10"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="rounded-2xl bg-gradient-to-r from-[#C9A96E] to-[#D4B896] px-4 py-2 text-sm font-semibold text-[#0B1220] transition hover:from-[#D4B896] hover:to-[#E0C5A0] shadow-md hover:shadow-lg"
            >
              Sign up
            </Link>
          </>
        )}

        {user && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 rounded-2xl border border-[#C9A96E]/40 bg-white/5 px-4 py-2 text-[#E5E7EB] transition hover:border-[#C9A96E]/70 hover:bg-white/10"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
              <div className="overflow-hidden rounded-full border border-[#C9A96E]/60 bg-gradient-to-r from-[#C9A96E] to-[#1F8A8A] text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="relative top-1 h-5 w-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="hidden md:block font-light text-[#E5E7EB]">
                {user.name?.split(' ')[0]}
              </div>
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white/5 shadow-lg border border-white/10 backdrop-blur">
                <Link
                  to="/account"
                  className="block px-4 py-2 text-sm text-[#E5E7EB] hover:bg-[#C9A96E]/10 transition font-light"
                  onClick={() => setShowMenu(false)}
                >
                  My Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full border-t border-white/10 px-4 py-2 text-left text-sm text-[#C9A96E] hover:bg-[#C9A96E]/10 transition font-light"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;