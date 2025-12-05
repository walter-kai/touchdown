import React, { useEffect, useState, useRef } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';

import OnlineFooterNavBar from './components/common/navs/FooterNavBar';
import GameNavBar from './components/common/navs/MainNavBar';

import NFL from './pages/nfl/NFL';
import NFLTeamPage from './pages/nfl/Team';
import NFLPlayerPage from './pages/nfl/Player';
import NFLGame from './pages/nfl/Game';


import PrivacyPolicy from './pages/x/legal/PrivacyPolicy';
import TermsOfService from './pages/x/legal/TermsOfService';
import NotFound from './pages/NotFound';
import Settings from './pages/i/Settings';

import LandingPage from './pages/x/Landing';

import TickerBar from './components/common/TickerBar';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { useAuth } from './providers/AuthContext';
import { PicksProvider } from './providers/PicksContext';
import LoginModal from './components/common/LoginModal';

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
  const [gameTab, setGameTab] = useState<'info' | 'team' | 'player' | 'headtohead' | 'prediction' | 'schedule' | 'news' | 'plays' | 'odds' | 'pick'>('info');
  const [navPreset, setNavPreset] = useState<'scoreboard' | 'summary'>('scoreboard');
  const [gameStatus, setGameStatus] = useState<'pre' | 'in' | 'post' | undefined>(undefined);
  
  // Ref to communicate button clicks to NFLGame
  const tabClickCallbackRef = useRef<((tab: string) => void) | null>(null);
  
  const handleTabClick = (tab: 'info' | 'team' | 'player' | 'headtohead' | 'prediction' | 'schedule' | 'news' | 'plays' | 'odds' | 'pick') => {
    if (tabClickCallbackRef.current) {
      tabClickCallbackRef.current(tab);
    }
    setGameTab(tab);
  };
  
  // Check if we're on a game page or team page or player page
  const isGamePage = location.pathname.startsWith('/nfl/game/');
  const isTeamPage = location.pathname.startsWith('/nfl/team/');
  const isPlayerPage = location.pathname.startsWith('/nfl/player/');

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
      setGameStatus(undefined);
    }
  }, [location.pathname, isGamePage]);

  return (
    <PicksProvider>
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
                  <Route path="/" element={<NFL />} />
                  <Route path="/nfl" element={<NFL />} />
                  <Route path="/nfl/game/:gameId" element={<NFLGame activeTab={gameTab as 'info' | 'team' | 'player' | 'headtohead' | 'prediction' | 'plays'} onTabChange={(tab) => setGameTab(tab)} onPresetChange={setNavPreset} onGameStatusChange={setGameStatus} onRegisterTabClick={(callback) => tabClickCallbackRef.current = callback} />} />
                  <Route path="/nfl/team/:teamId" element={<NFLTeamPage activeTab={gameTab as 'info' | 'team' | 'player' | 'headtohead' | 'prediction' | 'schedule' | 'news' | 'plays'} onTabChange={setGameTab} onRegisterTabClick={(callback) => tabClickCallbackRef.current = callback} />} />
                  <Route path="/nfl/player/:playerId" element={<NFLPlayerPage activeTab={gameTab as 'info' | 'schedule' | 'news'} onTabChange={(tab) => setGameTab(tab as any)} onRegisterTabClick={(callback) => tabClickCallbackRef.current = callback} />} />
                  

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
        
        {/* Game Navigation Bar - Show on game pages, team pages, and player pages */}
        {(isGamePage || isTeamPage || isPlayerPage) && (
          <GameNavBar 
            activeTab={gameTab} 
            onTabChange={setGameTab} 
            onTabClick={handleTabClick} 
            preset={isTeamPage ? 'team' : isPlayerPage ? 'player' : navPreset} 
            gameStatus={isGamePage ? gameStatus : undefined}
          />
        )}
        
        {/* Always render LoginModal globally, not conditionally */}
        <LoginModal isOpen={showLoginModal} onClose={closeLoginModal} />
        
      </div>
    </div>
    </PicksProvider>
  );
};

export default App;
