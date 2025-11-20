import React, { useEffect, useState, useRef } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';

import OnlineFooterNavBar from './components/common/navs/FooterNavBar';
import GameNavBar from './components/common/navs/GameNavBar';

import NFL from './pages/nfl/NFL';
import NFLTeamPage from './pages/nfl/Team';
import NFLPlayerPage from './pages/nfl/Player';
import NFLGame from './pages/nfl/Game';

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
import HowItWorks from './pages/x/HowItWorks';
import TickerBar from './components/common/TickerBar';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { useAuth } from './providers/AuthContext';
import LoginModal from './components/common/LoginModal';
import OnlineNavBar from './components/common/navs/NavBar';
import { connect } from 'http2';

// Main App component
const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showFooterMenu, setShowFooterMenu] = useState(false);
  const [showOnlineFooterMenu, setShowOnlineFooterMenu] = useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const onlineMenuRef = React.useRef<HTMLDivElement>(null);
  const toggleButtonRef = React.useRef<HTMLButtonElement>(null);
  const onlineToggleButtonRef = React.useRef<HTMLButtonElement>(null);
  const { showLoginModal, closeLoginModal, user } = useAuth();
  const nodeRef = useRef<HTMLDivElement>(null);
  
  // State for game page navigation
  const [gameTab, setGameTab] = useState<'info' | 'team' | 'player' | 'headtohead' | 'prediction' | 'odds'>('info');
  
  // Check if we're on a game page
  const isGamePage = location.pathname.startsWith('/nfl/game/');

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
  
  // Reset game tab when navigating to a new game
  useEffect(() => {
    if (isGamePage) {
      setGameTab('info');
    }
  }, [location.pathname, isGamePage]);

  return (
    <div className="min-h-screen overflow-x-hidden relative bg-black/90 bg-blend-overlay">
      
      {/* Content Container */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {(location.pathname.startsWith("/x/") || location.pathname === "/") && (
          <>
            <TickerBar />
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
                  <Route path="/nfl/game/:gameId" element={<NFLGame activeTab={gameTab} onTabChange={setGameTab} />} />
                  <Route path="/nfl/team/:teamId" element={<NFLTeamPage />} />
                  <Route path="/nfl/player/:playerId" element={<NFLPlayerPage />} />
                  
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
        
        {/* Game Navigation Bar - Only show on game pages */}
        {isGamePage && (
          <GameNavBar activeTab={gameTab} onTabChange={setGameTab} />
        )}
        
        {/* Always render LoginModal globally, not conditionally */}
        <LoginModal isOpen={showLoginModal} onClose={closeLoginModal} />
        
      </div>
    </div>
  );
};

export default App;
