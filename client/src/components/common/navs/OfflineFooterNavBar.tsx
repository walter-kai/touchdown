import React, { useEffect, useState } from "react";
import { FaChevronCircleUp } from 'react-icons/fa';
import LoadingScreenDots from '../LoadingScreenDots';
import { useAuth } from "../../../providers/AuthContext";


interface OfflineNavbarProps {
  navigate: (path: string) => void;
  toggleButtonRef: React.RefObject<HTMLButtonElement>;
  showFooterMenu: boolean;
  setShowFooterMenu: React.Dispatch<React.SetStateAction<boolean>>;
  menuRef: React.RefObject<HTMLDivElement>;
  currentPath: string;
}

const OfflineFooterNavBar: React.FC<OfflineNavbarProps> = ({
  navigate,
  toggleButtonRef,
  showFooterMenu,
  setShowFooterMenu,
  menuRef,
  currentPath
}) => {
  const [isTriggering, setIsTriggering] = useState(false);

  const { triggerLoginModal } = useAuth();

  useEffect(() => {
    if (isTriggering) {
      // Reset after 10 seconds if still triggering (modal closed manually)
      const timeout = setTimeout(() => {
        setIsTriggering(false);
      }, 10000);

      return () => clearTimeout(timeout);
    }
  }, [isTriggering]);

  const handleEnterClick = () => {
    setIsTriggering(true);
    triggerLoginModal();
  };
  useEffect(() => {
    if (!showFooterMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (
        (menuRef.current && menuRef.current.contains(e.target as Node)) ||
        (toggleButtonRef.current && toggleButtonRef.current.contains(e.target as Node))
      ) {
        return;
      }
      setShowFooterMenu(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showFooterMenu, menuRef, toggleButtonRef, setShowFooterMenu]);

  // Helper for active nav button
  const navBtn = (label: string, path: string) => {
    const isActive = currentPath === path;
    return (
      <button
        onClick={() => navigate(path)}
        className={`btn-link px-8 py-3 text-lg transition-all duration-150 rounded-lg
          ${isActive
            ? 'bg-[#00ffe7]/20 text-[#00ffe7] font-bold shadow-[0_0_8px_#00ffe7] underline underline-offset-4'
            : 'hover:bg-[#23263a]/60 hover:text-[#00ffe7]'
          }`}
        aria-current={isActive ? "page" : undefined}
      >
        {label}
      </button>
    );
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 w-full px-4 z-30 flex justify-between items-center gap-6 py-4 bg-black/60 backdrop-blur-md border-t border-[#00ffe7]/20">
        {/* Nav Buttons (now on the left) */}
        <div className='gap-4 flex'>
          {navBtn('Home', '/')}
          {navBtn('How this works', '/x/how-it-works')}
          {navBtn('About', '/x/about')}
          {navBtn('Blog', '/x/blog')}
        </div>
        
        {/* Right side buttons */}
        <div className="flex items-center gap-4">
          {/* Enter the city button */}
          <button
            onClick={handleEnterClick}
            disabled={isTriggering}
            className="btn-special px-6 py-2 text-base font-bold animate-pulse hover:animate-none transition-all duration-150 rounded-lg"
          >
            {isTriggering ? <LoadingScreenDots size={3} /> : "Enter the city"}
          </button>
          
          {/* Start Menu Button with Dexter logo */}
          <button
            type="button"
            ref={toggleButtonRef}
            className=" rounded-full p-3 shadow-lg hover:bg-[#181a23] transition"
            onClick={e => { e.stopPropagation(); setShowFooterMenu(v => !v); }}
            aria-label="Open Start Menu"
          >
            <img 
              src="/logos/dexter3d.svg" 
              alt="DexterCity" 
              className={`h-6 w-6 transition-transform duration-300 drop-shadow-[0_0_4px_#00ffe7] `}
            />
          </button>
        </div>
      </div>
      {/* Drop-up Start Menu Footer */}
      {showFooterMenu && (
        <div ref={menuRef} className="fixed right-6 bottom-24 z-50 w-80 bg-[#181a23]/95 border border-[#00ffe7]/30 rounded-2xl shadow-2xl p-6 animate-fadeInUp">
          <img src="/logos/dexter3d.svg" className="h-10 mb-4" alt="DexterCity" />
          <p className="text-[#e0e7ef] text-sm mb-4">Trading made easy in the city.</p>
          <p className="text-[#e0e7ef] text-sm mb-4">© 2025 Dexter City. All rights reserved.</p>
          
          <div>
            <h3 className="text-[#00ffe7] font-bold mb-2">Documentation</h3>
            <div className="space-y-2">
              <a href="https://docs.dextercity.com/whitepaper" target="_blank" rel="noopener noreferrer" className="flex items-center text-[#e0e7ef] hover:text-[#00ffe7] transition text-sm">
                Whitepaper
              </a>
              <button onClick={() => {navigate('/legal/privacy-policy'); setShowFooterMenu(false);}} className="block text-left w-full text-[#e0e7ef] hover:text-[#00ffe7] transition text-sm">Privacy Policy</button>
              <button onClick={() => {navigate('/legal/terms-of-service'); setShowFooterMenu(false);}} className="block text-left w-full text-[#e0e7ef] hover:text-[#00ffe7] transition text-sm">Terms of Service</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OfflineFooterNavBar;
