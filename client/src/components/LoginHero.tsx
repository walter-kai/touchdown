import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../providers/AuthContext";
import { getNewsUrl } from "@/utils/espnApi";
import type { NewsArticle } from "@/types/espn/news";
import { FaGoogle } from "react-icons/fa";
import { processImagesWithEyeDetection } from "@/utils/imageCropper";

interface LoginHeroProps {
  league?: string;
}

const LoginHero: React.FC<LoginHeroProps> = ({ league = "nfl" }) => {
  const { isAuthenticated } = useAuth();
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [processedImages, setProcessedImages] = useState<string[]>([]);

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

  // Process images with eye detection when news updates
  useEffect(() => {
    if (news.length === 0) return;

    const processImages = async () => {
      // Get images from news articles - one primary image per article
      const imageUrls = news
        .filter((article) => article.images && article.images.length > 0)
        .slice(0, 8) // Get more than we need since some might be filtered out
        .map((article) => article.images[0].url);

      if (imageUrls.length === 0) return;

      try {
        // Process images and filter out those without detectable eyes
        // Pass dummy dimensions since we're keeping original size
        const processed = await processImagesWithEyeDetection(imageUrls, 0, 0);
        setProcessedImages(processed.slice(0, 6)); // Keep max 6 images
      } catch (error) {
        console.error('Error processing images:', error);
        // Fallback to raw images if face detection fails
        setProcessedImages(imageUrls.slice(0, 6));
      }
    };

    processImages();
  }, [news]);

  if (isAuthenticated) {
    return null;
  }

  const handleGoogleLogin = () => {
    const popupWidth = 500;
    const popupHeight = 600;
    const popupLeft = window.screenX + (window.outerWidth - popupWidth) / 2;
    const popupTop = window.screenY + (window.outerHeight - popupHeight) / 2;

    // Point to backend server (usually port 3001 in dev)
    const authUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? 'http://localhost:3001/auth/google/login'
      : '/auth/google/login';

    window.open(
      authUrl,
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
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8">
            {/* Left: Title and Caption */}
            <div className="flex-1 flex flex-col gap-4 text-center md:text-left order-2 md:order-1">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-clip-text text-transparent animate-fade-in-up" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
                Games are live!
              </h2>
              <p className="text-sm sm:text-base text-text-light leading-relaxed animate-fade-in-up" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
                Use your strategy as coach to swap players in real-time, build streaks, and prove you're the ultimate manager.
              </p>
            </div>

            {/* Center: Diagonal Stripe Images */}
            {(loading || processedImages.length === 0) && (
              <div className="w-full h-32 md:h-40 order-1 md:order-2" aria-hidden />
            )}

            {processedImages.length > 0 && (
              <div 
                className="relative flex w-full h-32 md:h-40 order-1 md:order-2"
                style={{
                  clipPath: "polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%)",
                  maskImage: "linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)",
                  WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
                }}
              >
                {processedImages.map((imageData, idx) => {
                  const { dataUrl, eyePositionX } = JSON.parse(imageData);
                  return (
                    <div
                      key={idx}
                      className="flex-1 h-full animate-fade-in-scale"
                      style={{
                        clipPath: "polygon(6% 0, 100% 0, 94% 100%, 0 100%)",
                        animationDelay: `${idx * 150}ms`,
                        animationFillMode: 'both',
                      }}
                    >
                      <img
                        src={dataUrl}
                        alt={`Article ${idx + 1}`}
                        className="w-full h-full object-cover"
                        style={{
                          objectPosition: `${eyePositionX}% center`
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Right: Sign Up Button */}
            <button
              onClick={handleGoogleLogin}
              className="btn-orange flex items-center justify-center gap-3 flex-shrink-0 px-6 sm:px-8 py-3 sm:py-4 md:px-8 md:py-4 hover:bg-gray-50 rounded-lg font-bold transition-all duration-300 transform hover:scale-105 whitespace-nowrap text-sm sm:text-base md:text-base order-3 md:order-3 md:h-fit animate-scale-in"
              style={{ animationDelay: '350ms', animationFillMode: 'both' }}
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
