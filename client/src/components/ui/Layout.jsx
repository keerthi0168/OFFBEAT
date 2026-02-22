import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import ChatbotWidget from './ChatbotWidget';
import { trackEvent } from '@/utils/analytics';

function Layout() {
  const location = useLocation();

  useEffect(() => {
    trackEvent('page_view', { path: location.pathname });
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#0B1220] via-[#111827] to-[#0B1220]">
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
      <ChatbotWidget />
    </div>
  );
}

export default Layout;