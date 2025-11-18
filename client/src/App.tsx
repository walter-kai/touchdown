import React, { useEffect, useState, useRef } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';

import OnlineFooterNavBar from './components/common/navs/OnlineFooterNavBar';

import NFL from './pages/nfl/NFL';
import NFLTeamPage from './pages/nfl/Team';

import Dashboard from './pages/i/Dashboard';
import Shop from './pages/i/Shop';
import Garage from './pages/i/Garage';
import BuildBot from './pages/i/Build';
import Blog from './pages/x/Blog';
import AboutUs from './pages/x/AboutUs';
import PrivacyPolicy from './pages/x/legal/PrivacyPolicy';
import TermsOfService from './pages/x/legal/TermsOfService';
import NotFound from './pages/NotFound';
import Settings from './pages/i/Settings';
import DailyPoolActivity from './components/dashboard/DailyPoolActivity';
import LandingPage from './pages/x/Landing';
import OfflineFooterNavBar from './components/common/navs/OfflineFooterNavBar';
import HowItWorks from './pages/x/HowItWorks';
import TickerBar from './components/common/TickerBar';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { useAuth } from './providers/AuthContext';
import LoginModal from './components/common/LoginModal';
import OnlineNavBar from './components/common/navs/OnlineNavBar';
import { connect } from 'http2';

// Main App component
const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [showFooterMenu, setShowFooterMenu] = useState(false);
  const [showOnlineFooterMenu, setShowOnlineFooterMenu] = useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const onlineMenuRef = React.useRef<HTMLDivElement>(null);
  const toggleButtonRef = React.useRef<HTMLButtonElement>(null);
  const onlineToggleButtonRef = React.useRef<HTMLButtonElement>(null);
  const { showLoginModal, closeLoginModal, user } = useAuth();
  const nodeRef = useRef<HTMLDivElement>(null);

  // Redirect unauthenticated users from /i/ routes
  useEffect(() => {
    if (location.pathname.startsWith('/i/') && !user) {
      navigate('/');
    }
  }, [location.pathname, user, navigate]);

  // Reset scroll position on route change (except for hash navigation)
  useEffect(() => {
    if (!location.hash) {
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);

  // Preload garage background image
  useEffect(() => {
    const img = new Image();
    img.onload = () => setBackgroundLoaded(true);
    img.src = '/bg/i/garage.png';
  }, []);

  // Handle scroll for parallax effect
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Determine background image based on current route
  const getBackgroundImage = () => {
    if (location.pathname === '/i/garage' || location.pathname === '/bots') {
      return backgroundLoaded ? "url('/bg/i/garage.png')" : "url('/bg/city.jpg')";
    }
    return "url('/bg/city.jpg')";
  };

  // Calculate parallax transform with bounds
  const getParallaxTransform = (multiplier: number) => {
    const documentHeight = document.documentElement.scrollHeight;
    const windowHeight = window.innerHeight;
    const maxScroll = documentHeight - windowHeight;
    
    // Prevent division by zero and ensure we have scrollable content
    if (maxScroll <= 0) return 'translateY(0px)';
    
    // Calculate scroll progress (0 to 1)
    const scrollProgress = Math.min(scrollY / maxScroll, 1);
    
    // Limit transform to a small percentage of viewport height
    const maxTransform = windowHeight * 0.1; // Reduced from 0.3 to 0.1
    const transform = scrollProgress * maxTransform * multiplier;
    
    return `translateY(${transform}px)`;
  };

  return (
    <div className="min-h-screen overflow-x-hidden relative">
      {/* Background Container with Parallax */}
        
          <div className="fixed inset-0 z-0 overflow-hidden">
            <div 
              className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out bg-black"
              style={{
                backgroundImage: getBackgroundImage(),
                transform: getParallaxTransform(0.5),
                willChange: 'transform',
                height: '110%', // Slightly larger to accommodate transform
                top: '-5%',
              }}
            />
            <div 
              className="absolute inset-0 bg-gradient-to-br from-neon-cyan via-neon-darker to-neon-purple opacity-100"
              style={{
                transform: getParallaxTransform(0.3),
                willChange: 'transform',
              }}
            />
            <div 
              className="absolute inset-0 bg-black opacity-70"
              style={{
                transform: getParallaxTransform(0.3),
                willChange: 'transform',
              }}
            />
          </div>
        {/* )} */}
      
      {/* Content Container */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {(location.pathname.startsWith("/x/") || location.pathname === "/") && (
          <>
            <TickerBar />
            <OfflineFooterNavBar
              navigate={navigate}
              toggleButtonRef={toggleButtonRef as React.RefObject<HTMLButtonElement>}
              showFooterMenu={showFooterMenu}
              setShowFooterMenu={setShowFooterMenu}
              menuRef={menuRef as React.RefObject<HTMLDivElement>}
              currentPath={location.pathname} // <-- pass current path
            />
          </>
        )}
        {location.pathname.startsWith("/i/") && user && (
          <>
            <OnlineNavBar />
            <OnlineFooterNavBar 
              navigate={navigate}
              toggleButtonRef={onlineToggleButtonRef as React.RefObject<HTMLButtonElement>}
              showFooterMenu={showOnlineFooterMenu}
              setShowFooterMenu={setShowOnlineFooterMenu}
              menuRef={onlineMenuRef as React.RefObject<HTMLDivElement>}
              currentPath={location.pathname}
            />
          </>
        )}
        
        {/* Main content area that grows to fill space */}
        <div className="flex-1 relative">
          <TransitionGroup component={null}>
            <CSSTransition
              key={location.pathname}
              classNames="fade"
              timeout={10}
              unmountOnExit
              nodeRef={nodeRef}
            >
              {/* 
                Ensure absolute positioning for smooth transitions
                and prevent route stacking during fade
              */}
              <div ref={nodeRef} >
                <Routes location={location}>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/nfl" element={<NFL />} />
                  <Route path="/nfl/team/:teamId" element={<NFLTeamPage />} />
                  
                  <Route path="/x/about" element={<AboutUs />} />
                  <Route path="/x/how-it-works" element={<HowItWorks />} />
                  <Route path="/x/blog" element={<Blog />} />
                  <Route path="/x/pools" element={<DailyPoolActivity />} />
                  
                  {/* Bot-related routes under /bots/ */}
                  <Route path="/i/dashboard" element={<Dashboard />} />
                  <Route path="/i/garage" element={<Garage />} />
                  <Route path="/i/garage/build" element={<BuildBot />} />
                  
                  {/* Backward compatibility routes */}
                  <Route path="/dash" element={<Dashboard />} />
                  <Route path="/build" element={<BuildBot />} />
                  <Route path="/bots" element={<Garage />} />
                  
                  {/* Other routes */}
                  <Route path="/i/shop" element={<Shop />} />
                  <Route path="/i/shop/:botId" element={<Shop />} />
                  <Route path="/settings" element={<Settings />} />
                  
                  {/* Legal routes under /legal/ */}
                  <Route path="/legal/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/legal/terms-of-service" element={<TermsOfService />} />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>

              </div>
            </CSSTransition>
          </TransitionGroup>
        </div>
        {/* Always render LoginModal globally, not conditionally */}
        <LoginModal isOpen={showLoginModal} onClose={closeLoginModal} />
        
      </div>
    </div>
  );
};

export default App;
