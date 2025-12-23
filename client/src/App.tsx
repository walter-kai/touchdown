import React, { useEffect, useState, useRef } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';

import GameNavBar from './components/common/navs/NavBar';
import LoginNav from './components/common/navs/LoginNav';

import DashboardCarousel from './pages/nfl/dashoboard/DashboardCarousel';
import GameGrid from './pages/nfl/dashoboard/GameGrid';
import NFLTeamPage from './pages/nfl/Team';
import NFLPlayerPage from './pages/nfl/Player';
import GameContainer from './pages/nfl/dashoboard/GameContainer';



import NotFound from './pages/NotFound';


import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { useAuth } from './providers/AuthContext';
import { PicksProvider } from './providers/PicksContext';
import LoginModal from './components/common/LoginModal';

// Google OAuth callback handler (in-tab redirect)
const GoogleOAuthCallback: React.FC = () => {
  useEffect(() => {
    const run = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        if (!code) {
          // Missing code: redirect home
          window.location.replace('/');
          return;
        }

        // Exchange code with backend
        const resp = await fetch(`/auth/google/callback?code=${encodeURIComponent(code)}&format=json`, {
          headers: { 'Accept': 'application/json' }
        });
        if (!resp.ok) {
          // On failure, go home
          window.location.replace('/');
          return;
        }

        const data = await resp.json();
        const result = data?.data || data;
        // If opened as a popup, notify opener and close
        if (window.opener) {
          try {
            window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', token: result.accessToken, user: result.user, expiresIn: result.expiresIn }, '*');
          } catch {}
          window.close();
          return;
        }
        // Otherwise store locally and redirect
        try {
          const ttlMs = (typeof result.expiresIn === 'number' ? result.expiresIn : 7 * 24 * 60 * 60) * 1000;
          const expiryTime = Date.now() + ttlMs;
          localStorage.setItem('dexter_access_token', result.accessToken);
          localStorage.setItem('dexter_token_expiry', String(expiryTime));
          localStorage.setItem('dexter_user', JSON.stringify(result.user));
        } catch {}
        window.location.replace('/');
      } catch (err) {
        window.location.replace('/');
      }
    };
    run();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center text-white">
      <div className="bg-bg-dark border border-neon-cyan/30 rounded-lg p-6">
        Processing login...
      </div>
    </div>
  );
};

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
  const [gameTab, setGameTab] = useState<'info' | 'team' | 'player' | 'headtohead' | 'prediction' | 'schedule' | 'news' | 'plays' | 'odds' | 'pick' | 'yourpicks' | 'dashboard' | 'games'>('info');
  const [navPreset, setNavPreset] = useState<'scoreboard' | 'summary'>('scoreboard');
  const [gameStatus, setGameStatus] = useState<'pre' | 'in' | 'post' | undefined>(undefined);
  
  // Ref to communicate button clicks to NFLGame
  const tabClickCallbackRef = useRef<((tab: string) => void) | null>(null);
  
  const handleTabClick = (tab: 'info' | 'team' | 'player' | 'headtohead' | 'prediction' | 'schedule' | 'news' | 'plays' | 'odds' | 'pick' | 'yourpicks' | 'dashboard' | 'games') => {
    if (tabClickCallbackRef.current) {
      tabClickCallbackRef.current(tab);
    }
    setGameTab(tab);
  };
  
  // Check if we're on a game page or team page or player page
  const isGamePage = location.pathname.startsWith('/nfl/game/');
  const isTeamPage = location.pathname.startsWith('/nfl/team/');
  const isPlayerPage = location.pathname.startsWith('/nfl/player/');
  
  // Check if we're on Dashboard or GamesList pages
  const isDashboardOrGames = location.pathname === '/' || 
                             location.pathname === '/nfl' || 
                             location.pathname === '/nfl/dashboard' || 
                             location.pathname === '/nfl/games';

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

  // Create a stable key for carousel routes to prevent unmounting during tab switches
  const getTransitionKey = () => {
    // Group dashboard/games routes under same key to prevent transition animation
    if (location.pathname === '/' || 
        location.pathname === '/nfl' || 
        location.pathname === '/nfl/dashboard' || 
        location.pathname === '/nfl/games') {
      return 'dashboard-carousel';
    }
    return location.pathname;
  };

  return (
    <PicksProvider>
      <div className="min-h-screen overflow-x-hidden relative bg-black/90 bg-blend-overlay">
      
      {/* Top Login/Nav (hide on auth processing page) */}
      {location.pathname !== '/auth/google/callback' && <LoginNav />}

      {/* Content Container */}
      <div className="relative z-10 flex flex-col min-h-screen">
        
        {/* Main content area that grows to fill space */}
        <div className="flex-1 relative mx-0 pt-14">
          <TransitionGroup component={null}>
            <CSSTransition
              key={getTransitionKey()}
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
                  <Route path="/" element={user ? <DashboardCarousel activeTab="dashboard" onTabChange={(tab) => navigate(tab === 'games' ? '/nfl/games' : '/')} /> : <GameGrid />} />
                  <Route path="/nfl" element={user ? <DashboardCarousel activeTab="dashboard" onTabChange={(tab) => navigate(tab === 'games' ? '/nfl/games' : '/nfl')} /> : <GameGrid />} />
                  <Route path="/nba" element={user ? <DashboardCarousel activeTab="dashboard" onTabChange={(tab) => navigate(tab === 'games' ? '/nba/games' : '/nba')} /> : <GameGrid />} />
                  <Route path="/nfl/dashboard" element={<DashboardCarousel activeTab="dashboard" onTabChange={(tab) => navigate(tab === 'games' ? '/nfl/games' : '/nfl/dashboard')} />} />
                  <Route path="/nfl/games" element={<DashboardCarousel activeTab="games" onTabChange={(tab) => navigate(tab === 'games' ? '/nfl/games' : '/nfl/dashboard')} />} />
                  <Route path="/auth/google/callback" element={<GoogleOAuthCallback />} />
                  <Route path="/nfl/game/:gameId" element={<GameContainer activeTab={gameTab} onTabChange={setGameTab} onPresetChange={setNavPreset} onGameStatusChange={setGameStatus} onRegisterTabClick={(callback) => tabClickCallbackRef.current = callback} />} />
                  <Route path="/nfl/team/:teamId" element={<NFLTeamPage activeTab={gameTab as 'info' | 'team' | 'player' | 'headtohead' | 'prediction' | 'schedule' | 'news' | 'plays'} onTabChange={setGameTab} onRegisterTabClick={(callback) => tabClickCallbackRef.current = callback} />} />
                  <Route path="/nfl/player/:playerId" element={<NFLPlayerPage activeTab={gameTab as 'info' | 'schedule' | 'news'} onTabChange={(tab) => setGameTab(tab as any)} onRegisterTabClick={(callback) => tabClickCallbackRef.current = callback} />} />
                  
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>

              </div>
            </CSSTransition>
          </TransitionGroup>
        </div>
        
        {/* Game Navigation Bar - Show on game pages, team pages, player pages, and dashboard/games when logged in */}
        {(isGamePage || isTeamPage || isPlayerPage || (isDashboardOrGames && user)) && (
          <GameNavBar 
            activeTab={isDashboardOrGames ? (location.pathname === '/nfl/games' ? 'games' : 'dashboard') : gameTab} 
            onTabChange={(tab) => {
              if (tab === 'dashboard' || tab === 'games') {
                // For dashboard/games tabs, call the callback that will update carousel state
                // We still need to handle this through navigation for now
                navigate(tab === 'games' ? '/nfl/games' : '/nfl/dashboard');
              } else {
                setGameTab(tab);
              }
            }}
            onTabClick={handleTabClick} 
            preset={isDashboardOrGames ? 'dashboard' : (isTeamPage ? 'team' : isPlayerPage ? 'player' : navPreset)}
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
