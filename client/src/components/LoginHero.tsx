import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../providers/AuthContext";
import { getNewsUrl } from "@/utils/espnApi";
import type { NewsArticle } from "@/types/espn/news";
import { FaGoogle } from "react-icons/fa";

interface LoginHeroProps {
  league?: string;
}

const LoginHero: React.FC<LoginHeroProps> = ({ league = "nfl" }) => {
  const { isAuthenticated } = useAuth();
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await axios.get(getNewsUrl(league as 'nfl' | 'nba'));
        if (response.data?.articles) {
          setNews(response.data.articles);
        }
      } catch (err) {
        console.error("Error fetching news for LoginHero:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [league]);

  if (isAuthenticated) {
    return null;
  }

  // Get images from news articles - one primary image per article
  const images = news
    .filter((article) => article.images && article.images.length > 0)
    .slice(0, 6)
    .map((article) => article.images[0]);

  const handleGoogleLogin = () => {
    const popupWidth = 500;
    const popupHeight = 600;
    const popupLeft = window.screenX + (window.outerWidth - popupWidth) / 2;
    const popupTop = window.screenY + (window.outerHeight - popupHeight) / 2;

    window.open(
      '/auth/google/login',
      'Google Login',
      `width=${popupWidth},height=${popupHeight},left=${popupLeft},top=${popupTop}`
    );
  };

  return (
    <div className="mx-2">
      <div className="x-3 relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-neon-pink/20 via-neon-cyan/20 to-neon-pink/20 border border-neon-pink/30 backdrop-blur-sm">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-neon-pink/5 via-transparent to-neon-cyan/5 animate-pulse"></div>

        <div className="relative py-2 md:py-12">
          {/* Mobile Layout: Stacked with Images First */}
          <div className="md:hidden flex flex-col items-center gap-2">
            {/* Diagonal Stripe Images - At Top on Mobile */}
            {!loading && images.length > 0 && (
              <div className="w-full flex justify-center">
                <div 
                  className="relative h-32"
                  style={{
                    clipPath: "polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)",
                    width: `${(images.length - 1) * 50 + 100}px`,
                    maskImage: "linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)",
                    WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
                  }}
                >
                  {images.map((image, idx) => (
                    <div
                      key={idx}
                      className="absolute h-full"
                      style={{
                        left: `${idx * 50}px`,
                        width: '100px',
                        clipPath: "polygon(50% 0, 100% 0, 85% 100%, 0 100%)",
                      }}
                    >
                      <img
                        src={image.url}
                        alt={`Article ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Title */}
            <h2 className="text-2xl sm:text-3xl font-bold text-center bg-gradient-to-r from-neon-pink via-neon-cyan to-neon-pink bg-clip-text text-transparent">
              Games are live!
            </h2>

            {/* Caption */}
            <p className="text-sm sm:text-base text-text-light leading-relaxed text-center">
              Use your strategy as coach to swap players in real-time, build streaks, and prove you're the ultimate manager.
            </p>

            {/* Sign Up Button */}
            <button
              onClick={handleGoogleLogin}
              className="flex items-center justify-center gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-white hover:bg-gray-50 rounded-lg font-bold text-gray-700 border border-gray-300 hover:border-gray-400 transition-all duration-300 transform hover:scale-105 whitespace-nowrap text-sm sm:text-base shadow-md"
            >
              <FaGoogle className="text-xl" />
              Sign in with Google
            </button>
          </div>

          {/* Desktop Layout: One Row Flex */}
          <div className="hidden md:flex items-center justify-between gap-8">
            {/* Left: Title and Caption */}
            <div className="flex-1 flex flex-col gap-4">
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-neon-pink via-neon-cyan to-neon-pink bg-clip-text text-transparent">
                Games are live!
              </h2>
              <p className="text-base text-text-light leading-relaxed">
                Use your strategy as coach to swap players in real-time, build streaks, and prove you're the ultimate manager.
              </p>
            </div>

            {/* Center: Diagonal Stripe Images */}
            {!loading && images.length > 0 && (
              <div 
                className="relative flex-shrink-0 h-40"
                style={{
                  clipPath: "polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)",
                  width: `${(images.length - 1) * 60 + 120}px`,
                  maskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
                  WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
                }}
              >
                {images.map((image, idx) => (
                  <div
                    key={idx}
                    className="absolute h-full"
                    style={{
                      left: `${idx * 60}px`,
                      width: '120px',
                      clipPath: "polygon(15% 0, 100% 0, 85% 100%, 0 100%)",
                    }}
                  >
                    <img
                      src={image.url}
                      alt={`Article ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Right: Sign Up Button */}
            <button
              onClick={handleGoogleLogin}
              className="flex items-center justify-center gap-3 flex-shrink-0 px-8 py-4 bg-white hover:bg-gray-50 rounded-lg font-bold text-gray-700 border border-gray-300 hover:border-gray-400 transition-all duration-300 transform hover:scale-105 whitespace-nowrap text-base h-fit shadow-md"
            >
              <FaGoogle className="text-xl" />
              Sign in with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginHero;
