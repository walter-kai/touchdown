import React from "react";
import type { Article } from '@/types/espn/game';

interface NewsCardProps {
  article: Article;
}

const NewsCard: React.FC<NewsCardProps> = React.memo(({ article }) => {
  const image = article.images && article.images.length > 0 ? article.images[0] : null;

  return (
    <a
      href={article.links.web.href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex-shrink-0 w-64 sm:w-72 md:w-80 bg-[#181a23]/90 rounded-lg border border-[#faafe8]/30 overflow-hidden hover:border-[#faafe8]/50 transition-all duration-300 group"
    >
      <div className="flex gap-2 sm:gap-3 p-2 sm:p-3">
        {image && (
          <div className="relative overflow-hidden w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded">
            <img 
              src={image.url} 
              alt={article.headline}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-xs sm:text-sm text-[#faafe8] mb-1 group-hover:text-[#00ffe7] transition-colors line-clamp-2">
            {article.headline}
          </h3>
          <p className="text-[10px] sm:text-xs text-gray-400 line-clamp-2">
            {article.description}
          </p>
        </div>
      </div>
    </a>
  );
});

NewsCard.displayName = 'NewsCard';

export default NewsCard;
