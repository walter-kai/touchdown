import React from "react";
import type { Article } from '@/types/espn/game';
import type { NewsArticle } from '@/types/espn/news';

interface NewsCardProps {
  article: Article | NewsArticle;
}

const NewsCard: React.FC<NewsCardProps> = React.memo(({ article }) => {
  const image = article.images && article.images.length > 0 ? article.images[0] : null;

  return (
    <a
      href={article.links.web.href}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-[#181a23]/90 rounded-lg border border-[#faafe8]/30 overflow-hidden hover:border-[#faafe8]/50 transition-all duration-300 group"
    >
      {image && (
        <div className="relative overflow-hidden w-full h-48 flex-shrink-0">
          <img 
            src={image.url} 
            alt={article.headline}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        </div>
      )}
      <div className="p-4">
        <h3 className="font-bold text-sm sm:text-base text-[#faafe8] mb-2 group-hover:text-[#00ffe7] transition-colors line-clamp-2">
          {article.headline}
        </h3>
        <p className="text-xs sm:text-sm text-gray-400 line-clamp-3 mb-3">
          {article.description}
        </p>
        {article.byline && (
          <p className="text-xs text-gray-500 italic">
            By {article.byline}
          </p>
        )}
      </div>
    </a>
  );
});

NewsCard.displayName = 'NewsCard';

export default NewsCard;
