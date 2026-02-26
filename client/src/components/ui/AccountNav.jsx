import { Link, useLocation } from 'react-router-dom';

const AccountNav = () => {
  const { pathname } = useLocation();
  let subpage = pathname.split('/')?.[2];

  if (subpage === undefined) {
    subpage = 'profile';
  }

  const linkClases = (type = null) => {
    let classes =
      'flex justify-center mx-10 md:mx-0 gap-1 py-2 px-6 rounded-full border border-white/10 text-[#E5E7EB] font-light transition';
    if (type === subpage) {
      classes += ' bg-gradient-to-r from-[#C9A96E] to-[#D4B896] text-[#0B1220] border-[#C9A96E]/40';
    } else {
      classes += ' bg-white/5 hover:bg-white/10';
    }
    return classes;
  };
  return (
    <nav className="mt-24 mb-8 flex w-full flex-col justify-center gap-2 p-8 md:flex-row md:p-0">
      <Link className={linkClases('profile')} to={'/account'}>
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
            d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
          />
        </svg>
        My Profile
      </Link>
    </nav>
  );
};

export default AccountNav;
