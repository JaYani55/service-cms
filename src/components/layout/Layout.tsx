import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../ui/Navbar';
import Breadcrumb from '../navigation/Breadcrumb';
import { RoleIndicator } from '../ui/RoleIndicator';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

const Layout = () => {
  const { isFirstLogin } = useAuth();
  const { language } = useTheme();
  const [showFirstLoginModal, setShowFirstLoginModal] = React.useState(false);

  return (
    <div className="flex flex-col min-h-screen app-layout">
      {/* Skip navigation link for keyboard users */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Skip to main content
      </a>
      
      <header role="banner">
        <Navbar />
        <RoleIndicator language={language} />
        {/* Add breadcrumb here */}
        <Breadcrumb />
      </header>
      
      <main 
        id="main-content" 
        role="main" 
        className="flex-grow container mx-auto px-4 py-6"
      >
        <Outlet />
      </main>

      {/* ✅ ADD: Live region for screen reader announcements */}
      <div 
        id="live-announcements" 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      >
        {/* This will be populated by JavaScript when status changes occur */}
      </div>
    </div>
  );
};

export default Layout;
