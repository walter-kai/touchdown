import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaExternalLinkAlt, FaNewspaper, FaRocket, FaBolt, FaEnvelope, FaHome, FaChevronDown, FaShoppingCart, FaTools, FaChartLine, FaTrophy, FaCog, FaTachometerAlt, FaPlus } from 'react-icons/fa';
import { useAuth } from '../../../providers/AuthContext';

interface NavLink {
  text: string;
  to: string;
  external?: boolean;
  isHash?: boolean;
  icon: React.ReactNode;
  hasDropdown?: boolean;
  dropdownItems?: { text: string; to: string; icon: React.ReactNode }[];
}

interface FeatureSection {
  id: string;
  title: string;
  icon: React.ReactNode;
}

const SubNavBar: React.FC = () => {
  const { currentRoute } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showFeaturesDropdown, setShowFeaturesDropdown] = useState(false);
  const [showGarageDropdown, setShowGarageDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const garageDropdownRef = useRef<HTMLDivElement>(null);

  // Feature sections that match the ones in Features.tsx
  const featureSections: FeatureSection[] = [
    { id: 'bot-shop', title: 'Bot Shop Marketplace', icon: <FaShoppingCart /> },
    { id: 'bot-garage', title: 'Bot Garage Workshop', icon: <FaTools /> },
    { id: 'analytics', title: 'Advanced Analytics', icon: <FaChartLine /> },
  ];

  // Custom subnav for all main app sections
  const mainNavLinks: NavLink[] = [
    { text: 'DASHBOARD', to: '/i/dashboard', icon: <FaTachometerAlt /> },
    { text: 'SHOP', to: '/i/shop', icon: <FaShoppingCart /> },
    { 
      text: 'GARAGE', 
      to: '/i/garage', 
      icon: <FaTools />, 
      hasDropdown: true,
      dropdownItems: [
        { text: 'View Garage', to: '/i/garage', icon: <FaTools /> },
        { text: 'Create Bot', to: '/i/garage/build', icon: <FaPlus /> },
      ]
    },
    { text: 'SETTINGS', to: '/settings', icon: <FaCog /> },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowFeaturesDropdown(false);
      }
      if (garageDropdownRef.current && !garageDropdownRef.current.contains(event.target as Node)) {
        setShowGarageDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Define navigation links for each route
  const getNavLinks = (): NavLink[] => {
    const path = location.pathname;
    if (
      path === '/i/dashboard' ||
      path === '/build' ||
      path === '/i/garage/build' ||
      path === '/i/shop' ||
      path === '/i/garage' ||
      path === '/settings'
    ) {
      return mainNavLinks;
    }
    switch (currentRoute) {
      case '/':
        return [
          { text: 'BLOG', to: '/x/blog', icon: <FaNewspaper /> },
          { text: 'GET STARTED', to: '#getting-started', isHash: true, icon: <FaRocket /> },
          { text: 'FEATURES', to: '#features', isHash: true, icon: <FaBolt />, hasDropdown: true },
          { text: 'CONTACT US', to: '/x/about', icon: <FaEnvelope /> }
        ];
      case '/x/blog':
        return [
          { text: 'Home', to: '/', icon: <FaHome /> },
          { text: 'GET STARTED', to: '/#getting-started', isHash: true, icon: <FaRocket /> },
          { text: 'FEATURES', to: '/#features', isHash: true, icon: <FaBolt />, hasDropdown: true },
          { text: 'CONTACT US', to: '/x/about', icon: <FaEnvelope /> }
        ];
      default:
        return [
          { text: 'Home', to: '/', icon: <FaHome /> },
          { text: 'GET STARTED', to: '/#getting-started', isHash: true, icon: <FaRocket /> },
          { text: 'FEATURES', to: '/#features', isHash: true, icon: <FaBolt />, hasDropdown: true },
          { text: 'CONTACT US', to: '/x/about', icon: <FaEnvelope /> }
        ];
    }
  };

  const handleClick = (link: NavLink) => {
    if (link.hasDropdown && link.text === 'FEATURES') {
      setShowFeaturesDropdown(!showFeaturesDropdown);
      return;
    }

    if (link.isHash) {
      const sectionId = link.to.replace('#', '').replace('/#', '');
      
      // If we're on the same page and it's a hash link
      if (currentRoute === '/' && link.to.startsWith('#')) {
        // Prevent default navigation and scroll to section with offset
        const element = document.getElementById(sectionId);
        if (element) {
          const offsetTop = element.offsetTop - 150; // Adjust for navbar height
          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          });
        }
        return;
      }
      
      // If we're on a different page, navigate then scroll
      if (link.to.startsWith('/#')) {
        navigate('/');
        // Wait for navigation to complete, then scroll
        setTimeout(() => {
          const element = document.getElementById(sectionId);
          if (element) {
            const offsetTop = element.offsetTop - 150; // Adjust for navbar height
            window.scrollTo({
              top: offsetTop,
              behavior: 'smooth'
            });
          }
        }, 100);
        return;
      }
    }
    
    // Default navigation for non-hash links - reset scroll position
    if (!link.isHash) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
    navigate(link.to);
  };

  const handleMouseEnter = (link: NavLink) => {
    if (link.hasDropdown && link.text === 'GARAGE') {
      setShowGarageDropdown(true);
    }
  };

  const handleMouseLeave = (link: NavLink) => {
    if (link.hasDropdown && link.text === 'GARAGE') {
      setShowGarageDropdown(false);
    }
  };

  const handleFeatureClick = (featureId: string) => {
    setShowFeaturesDropdown(false);
    
    // If we're on the home page, scroll directly
    if (currentRoute === '/') {
      // Wait a brief moment for dropdown to close, then scroll
      setTimeout(() => {
        console.log('Looking for element with ID:', featureId); // Debug log
        
        // Try multiple methods to find the element
        let targetElement = document.getElementById(featureId);
        
        // If not found by ID, try to find the section by looking for it within the features container
        if (!targetElement) {
          console.log('Element not found by ID, searching within features section');
          const featuresSection = document.getElementById('features');
          if (featuresSection) {
            // Look for the section within the features container
            const allSections = featuresSection.parentElement?.querySelectorAll('section[id]');
            targetElement = Array.from(allSections || []).find(
              (section) => section.id === featureId
            ) as HTMLElement;
          }
        }
        
        // If still not found, try querySelector with attribute selector
        if (!targetElement) {
          console.log('Trying querySelector with attribute selector');
          targetElement = document.querySelector(`[id="${featureId}"]`) as HTMLElement;
        }
        
        // Final fallback - look for any element containing the feature ID
        if (!targetElement) {
          console.log('Trying data-id fallback');
          targetElement = document.querySelector(`[data-id="${featureId}"]`) as HTMLElement;
        }
        
        if (targetElement) {
          console.log('Found target element:', targetElement);
          console.log('Element classList:', targetElement.classList.toString());
          
          // Get the actual position relative to the document
          const rect = targetElement.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const elementTop = rect.top + scrollTop;
          
          console.log('Element rect.top:', rect.top);
          console.log('Current scrollTop:', scrollTop);
          console.log('Calculated elementTop:', elementTop);
          
          // Calculate offset considering navbar heights
          const offsetTop = elementTop - 180;
          console.log('Final scroll target:', offsetTop);
          
          // Force the element to be visible before scrolling (in case it's hidden by intersection observer)
          if (targetElement.style.opacity === '0' || targetElement.classList.contains('opacity-0')) {
            console.log('Element is hidden, forcing visibility temporarily');
            targetElement.style.transition = 'none';
            targetElement.style.opacity = '1';
            targetElement.style.transform = 'translateY(0) translateX(0) rotate(0) scale(1)';
            
            // Restore original styles after scroll completes
            setTimeout(() => {
              targetElement.style.transition = '';
              // Don't reset opacity/transform here as the intersection observer will handle it
            }, 1000);
          }
          
          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          });
        } else {
          console.log('Element still not found, falling back to features section');
          // Final fallback to features section
          const featuresSection = document.getElementById('features');
          if (featuresSection) {
            const rect = featuresSection.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const elementTop = rect.top + scrollTop;
            const offsetTop = elementTop - 150;
            window.scrollTo({
              top: offsetTop,
              behavior: 'smooth'
            });
          }
        }
      }, 150);
    } else {
      // Navigate to home page, then scroll to section
      navigate('/');
      // Wait for navigation and component mounting
      setTimeout(() => {
        console.log('After navigation, looking for element:', featureId);
        
        // Use the same enhanced search logic for cross-page navigation
        let targetElement = document.getElementById(featureId);
        
        if (!targetElement) {
          const featuresSection = document.getElementById('features');
          if (featuresSection) {
            const allSections = featuresSection.parentElement?.querySelectorAll('section[id]');
            targetElement = Array.from(allSections || []).find(
              (section) => section.id === featureId
            ) as HTMLElement;
          }
        }
        
        if (!targetElement) {
          targetElement = document.querySelector(`[id="${featureId}"]`) as HTMLElement;
        }
        
        if (targetElement) {
          console.log('Found element after navigation:', targetElement);
          
          // Force visibility for cross-page navigation too
          targetElement.style.transition = 'none';
          targetElement.style.opacity = '1';
          targetElement.style.transform = 'translateY(0) translateX(0) rotate(0) scale(1)';
          
          const rect = targetElement.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const elementTop = rect.top + scrollTop;
          const offsetTop = elementTop - 180;
          
          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          });
          
          // Restore original styles after scroll completes
          setTimeout(() => {
            targetElement.style.transition = '';
          }, 1000);
        } else {
          console.log('Element not found after navigation, falling back');
          const featuresSection = document.getElementById('features');
          if (featuresSection) {
            const rect = featuresSection.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const elementTop = rect.top + scrollTop;
            const offsetTop = elementTop - 150;
            window.scrollTo({
              top: offsetTop,
              behavior: 'smooth'
            });
          }
        }
      }, 1000); // Longer timeout for cross-page navigation
    }
  };

  const navLinks = getNavLinks();
  const isDashboard = currentRoute === '/i/dashboard' || location.pathname === '/i/dashboard';
  const isHomePage = currentRoute === '/';

  return (
    <div className={`fixed w-full z-50 mt-12 bg-[#23263a]/80 border-t border-[#00ffe7]/30 ${isHomePage ? 'my-4' : ''} shadow-[0_8px_12px_-8px_#faafe8] backdrop-blur-md`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-wrap justify-center gap-4 text-sm h-16">
          {navLinks.map((link, index) => (
            <div 
              key={index} 
              className="relative" 
              ref={link.hasDropdown && link.text === 'FEATURES' ? dropdownRef : link.hasDropdown && link.text === 'GARAGE' ? garageDropdownRef : undefined}
              onMouseEnter={() => handleMouseEnter(link)}
              onMouseLeave={() => handleMouseLeave(link)}
            >
              <button
                onClick={() => handleClick(link)}
                className={`btn-nav flex items-center justify-center gap-2 h-full min-w-32 text-center uppercase cursor-pointer ${
                  (showFeaturesDropdown && link.hasDropdown && link.text === 'FEATURES') || 
                  (showGarageDropdown && link.hasDropdown && link.text === 'GARAGE') ? 'bg-[#00ffe7]/30 text-[#181a23]' : ''
                }`}
              >
                {link.icon}
                {link.text}
                {link.hasDropdown && !isDashboard && <FaChevronDown className={`text-xs transition-transform duration-200 ${
                  (link.text === 'FEATURES' && showFeaturesDropdown) || 
                  (link.text === 'GARAGE' && showGarageDropdown) ? 'rotate-180' : ''
                }`} />}
                {link.external && <FaExternalLinkAlt className="ml-1 text-xs" />}
              </button>

              {/* Features Dropdown */}
              {link.hasDropdown && link.text === 'FEATURES' && !isDashboard && (
                <div
                  className={`absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-72 bg-[#23263a] border border-[#00ffe7]/30 rounded-lg shadow-lg transition-all duration-300 ${
                    showFeaturesDropdown
                      ? 'opacity-100 translate-y-0 visible'
                      : 'opacity-0 -translate-y-2 invisible'
                  }`}
                >
                  <div className="py-2">
                    <div className="px-4 py-2 border-b border-[#00ffe7]/20">
                      <span className="text-[#00ffe7] font-semibold text-xs uppercase tracking-wider">
                        Platform Features
                      </span>
                    </div>
                    {featureSections.map((feature) => (
                      <button
                        key={feature.id}
                        onClick={() => handleFeatureClick(feature.id)}
                        className="w-full px-4 py-3 text-left hover:bg-[#00ffe7]/20 transition-colors duration-200 flex items-center gap-3"
                      >
                        <div className="text-[#00ffe7] text-lg">
                          {feature.icon}
                        </div>
                        <span className="text-[#e0e7ef] font-medium">
                          {feature.title}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Garage Dropdown */}
              {link.hasDropdown && link.text === 'GARAGE' && link.dropdownItems && (
                <div
                  className={`absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-48 bg-[#23263a] border border-[#00ffe7]/30 rounded-lg shadow-lg transition-all duration-300 ${
                    showGarageDropdown
                      ? 'opacity-100 translate-y-0 visible'
                      : 'opacity-0 -translate-y-2 invisible'
                  }`}
                >
                  <div className="py-2">
                    {link.dropdownItems.map((item, itemIndex) => (
                      <button
                        key={itemIndex}
                        onClick={() => {
                          setShowGarageDropdown(false);
                          navigate(item.to);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-[#00ffe7]/20 transition-colors duration-200 flex items-center gap-3"
                      >
                        <div className="text-[#00ffe7] text-lg">
                          {item.icon}
                        </div>
                        <span className="text-[#e0e7ef] font-medium">
                          {item.text}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubNavBar;
