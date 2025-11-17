import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaExternalLinkAlt } from 'react-icons/fa';

interface LinkPreviewData {
  title?: string;
  description?: string;
  images?: string[];
  url?: string;
  siteName?: string;
}

interface LinkPreviewCardProps {
  url: string;
}

const LinkPreviewCard: React.FC<LinkPreviewCardProps> = ({ url }) => {
  const [preview, setPreview] = useState<LinkPreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchLinkPreview();
  }, [url]);

  const fetchLinkPreview = async () => {
    try {
      setLoading(true);
      setError(false);
      const response = await axios.get(`/api/link/preview?url=${encodeURIComponent(url)}`);
      if (response.data.success) {
        setPreview(response.data.data);
      } else {
        setError(true);
      }
    } catch (error) {
      console.error('Failed to fetch link preview:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#23263a] border border-[#00ffe7]/30 rounded-lg p-4 animate-pulse">
        <div className="flex">
          <div className="w-48 h-32 bg-[#181a23] rounded flex-shrink-0"></div>
          <div className="p-4 flex-1">
            <div className="h-4 bg-[#181a23] rounded mb-2"></div>
            <div className="h-3 bg-[#181a23] rounded mb-2"></div>
            <div className="h-3 bg-[#181a23] rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !preview) {
    return (
      <div className="bg-[#181a23] border border-[#00ffe7]/20 rounded-lg p-4">
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[#00ffe7] hover:underline flex items-center gap-2"
        >
          View Link <FaExternalLinkAlt className="text-xs" />
        </a>
      </div>
    );
  }

  return (
    <div className="bg-[#23263a] border border-[#00ffe7]/30 rounded-lg overflow-hidden hover:shadow-[0_0_16px_#00ffe7]/30 transition-all duration-300">
      <a href={url} target="_blank" rel="noopener noreferrer" className="block">
        <div className="flex min-h-[128px]">
          {preview.images && preview.images.length > 0 ? (
            <img 
              src={preview.images[0]} 
              alt={preview.title || 'Preview image'}
              className="w-48 h-32 object-cover flex-shrink-0"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-48 h-32 bg-[#181a23] flex items-center justify-center flex-shrink-0">
              <span className="text-[#00ffe7] text-2xl">🔗</span>
            </div>
          )}
          <div className="flex-1 p-4 flex flex-col justify-center">
            {preview.title && (
              <h4 className="text-[#00ffe7] font-semibold text-lg mb-2 line-clamp-2">
                {preview.title}
              </h4>
            )}
            {preview.description && (
              <p className="text-[#e0e7ef] text-sm mb-2 line-clamp-3">
                {preview.description}
              </p>
            )}
            {preview.siteName && (
              <p className="text-[#b8eaff] text-xs">
                {preview.siteName}
              </p>
            )}
          </div>
        </div>
      </a>
    </div>
  );
};

export default LinkPreviewCard;
