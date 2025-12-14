import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { FaNewspaper } from "react-icons/fa";
import axios from "axios";
import type { NewsResponse, NewsArticle } from '../../../../types/espn/news';
import NewsCard from '../../components/nfl/NewsCard';
import LoadingFootball from '../../components/common/LoadingFootball';

interface NewsPageProps {
  teamId?: string;
}

const NFLNews: React.FC<NewsPageProps> = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [header, setHeader] = useState<string>("NFL News");

  useEffect(() => {
    fetchNews();
  }, [teamId]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build URL based on whether we have a team ID
      const url = teamId 
        ? `https://site.api.espn.com/apis/site/v2/sports/football/nfl/news?team=${teamId}`
        : 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/news?limit=50';
      
      const response = await axios.get<NewsResponse>(url);
      const data = response.data;
      
      setNews(data.articles || []);
      setHeader(data.header || "NFL News");
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-20">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-4 mb-5">
          <FaNewspaper className="text-4xl text-[#faafe8] animate-pulse" />
          <h1>
            {header.toUpperCase()}
          </h1>
          <FaNewspaper className="text-4xl text-[#faafe8] animate-pulse" />
        </div>
      </div>

      {/* Loading State */}
      {loading && <LoadingFootball message="Loading news..." />}

      {/* Error State */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 sm:p-5 md:p-6 text-center">
          <p className="text-red-400 font-bold mb-2 text-sm sm:text-base">Error loading news</p>
          <p className="text-[#e0e7ef] text-xs sm:text-sm">{error}</p>
        </div>
      )}

      {/* News Grid */}
      {!loading && news.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {news.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      )}

      {/* No News */}
      {!loading && news.length === 0 && !error && (
        <div className="text-center py-12 sm:py-16 md:py-20">
          <FaNewspaper className="text-4xl sm:text-5xl md:text-6xl text-[#faafe8] mx-auto mb-3 sm:mb-4" />
          <p className="text-[#e0e7ef] text-base sm:text-lg md:text-xl">No news available at this time</p>
        </div>
      )}
    </div>
  );
};

export default NFLNews;
