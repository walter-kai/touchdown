import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaYoutube, FaTwitter, FaEye, FaHeart, FaComment, FaRetweet, FaFilter, FaSort, FaChevronDown, FaChevronUp, FaCode, FaNewspaper } from 'react-icons/fa';
import LoadingScreenDots from '../common/LoadingScreenDots';

interface Author {
  id: string;
  name: string;
  username?: string;
  profile_url: string;
  profile_image_url: string;
  location?: string;
  verified?: boolean;
  followers_count?: number;
}

interface Metrics {
  engagement: number;
  reach?: number;
  sentiment: number;
  youtube?: {
    views: number;
    likes: number;
    comments: number;
  };
  twitter?: {
    retweet_count: number;
    like_count: number;
    reply_count: number;
    quote_count: number;
    impression_count: number;
  };
}

interface NewsItem {
  date: string | null;
  sourcetype: string;
  content: string | null;
  media_urls: string[];
  post_urls: string[];
  native_id: string | null;
  author: Author;
  metrics: Metrics;
  hashtags: string[];
  mentions: string[];
  language: string;
  post_type: string[];
}

interface NewsResponse {
  success: boolean;
  data: NewsItem[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

interface PlatformUpdate {
  version: string;
  date: string;
  title: string;
  description: string;
  type: 'feature' | 'improvement' | 'bugfix' | 'security' | 'major';
  status: 'released' | 'beta' | 'coming-soon';
}

const NewsUpdates: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [platformUpdates, setPlatformUpdates] = useState<PlatformUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'engagement'>('date');
  const [isPaused, setIsPaused] = useState(false);
  const [showTicker, setShowTicker] = useState(false);
  const [contentType, setContentType] = useState<'news' | 'updates'>('news');

  useEffect(() => {
    fetchNews();
    fetchPlatformUpdates();
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Call our backend endpoint instead of external API directly
      const response = await axios.get<NewsResponse>('/api/social-news/posts', {
        timeout: 10000, // 10 second timeout
      });
      
      if (response.data.success) {
        setNews(response.data.data);
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (err: any) {
      console.error('Full error details:', err);
      
      if (axios.isAxiosError(err)) {
        if (err.code === 'ECONNABORTED') {
          setError('Request timeout - please try again');
        } else if (err.response) {
          // Server responded with error status
          setError(`Server error: ${err.response.status} - ${err.response.data?.error || err.message}`);
        } else if (err.request) {
          // Request was made but no response received
          setError('Network error - unable to connect to server');
        } else {
          setError(`Request setup error: ${err.message}`);
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPlatformUpdates = async () => {
    try {
      const response = await fetch('/x/blog/x/blog.json');
      const updates = await response.json();
      setPlatformUpdates(updates);
    } catch (err) {
      console.error('Error fetching platform updates:', err);
    }
  };

  const getSourceIcon = (sourcetype: string) => {
    switch (sourcetype) {
      case 'youtube':
        return <FaYoutube className="text-red-500" />;
      case 'twitter':
        return <FaTwitter className="text-blue-400" />;
      default:
        return <span className="text-[#00ffe7]">📰</span>;
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const truncateContent = (content: string, maxLength: number = 200) => {
    if (!content) return '';
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  };

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 3) return 'text-green-400';
    if (sentiment < -3) return 'text-red-400';
    return 'text-[#e0e7ef]';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredAndSortedNews = news
    .filter(item => {
      if (filter === 'all') return true;
      return item.sourcetype === filter;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      } else {
        return b.metrics.engagement - a.metrics.engagement;
      }
    });

  // Auto-scroll functionality
  useEffect(() => {
    if (isPaused || filteredAndSortedNews.length === 0) return;

    const interval = setInterval(() => {
      setNews((prevNews) => {
        const firstItem = prevNews[0];
        const newItems = prevNews.slice(1);
        return [...newItems, firstItem];
      });
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, [isPaused, filteredAndSortedNews.length]);

  // Reset current index when filter changes
  useEffect(() => {
    setIsPaused(false);
  }, [filter, sortBy]);

  const getStatsData = () => {
    const filteredNews = news.filter(item => {
      if (filter === 'all') return true;
      return item.sourcetype === filter;
    });

    const demographics = {
      platforms: {
        youtube: filteredNews.filter(item => item.sourcetype === 'youtube').length,
        twitter: filteredNews.filter(item => item.sourcetype === 'twitter').length,
      },
      avgSentiment: filteredNews.length > 0 
        ? filteredNews.reduce((sum, item) => sum + item.metrics.sentiment, 0) / filteredNews.length 
        : 0,
      topHashtags: getTopHashtags(filteredNews, 5),
      timelineData: getTimelineData(filteredNews)
    };

    return demographics;
  };

  const getTopHashtags = (items: NewsItem[], limit: number) => {
    const hashtagCount: { [key: string]: number } = {};
    items.forEach(item => {
      item.hashtags.forEach(tag => {
        hashtagCount[tag] = (hashtagCount[tag] || 0) + 1;
      });
    });
    
    return Object.entries(hashtagCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([tag, count]) => ({ tag, count }));
  };

  const getTimelineData = (items: NewsItem[]) => {
    const timeline: { [key: string]: { count: number, engagement: number, sentiment: number } } = {};
    
    items.forEach(item => {
      if (!item.date) return;
      
      const date = new Date(item.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      
      if (!timeline[date]) {
        timeline[date] = { count: 0, engagement: 0, sentiment: 0 };
      }
      
      timeline[date].count++;
      timeline[date].engagement += item.metrics.engagement;
      timeline[date].sentiment += item.metrics.sentiment;
    });

    // Average the sentiment for each day
    Object.keys(timeline).forEach(date => {
      timeline[date].sentiment = timeline[date].sentiment / timeline[date].count;
    });

    return Object.entries(timeline)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .slice(-7); // Last 7 days
  };

  const getUpdateTypeIcon = (type: string) => {
    switch (type) {
      case 'feature': return '🚀';
      case 'improvement': return '⚡';
      case 'bugfix': return '🐛';
      case 'security': return '🔒';
      case 'major': return '💎';
      default: return '📝';
    }
  };

  const getUpdateTypeColor = (type: string) => {
    switch (type) {
      case 'feature': return 'bg-blue-500';
      case 'improvement': return 'bg-green-500';
      case 'bugfix': return 'bg-yellow-500';
      case 'security': return 'bg-red-500';
      case 'major': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'released': return <span className="bg-green-500 text-white px-2 py-1 rounded text-xs">Released</span>;
      case 'beta': return <span className="bg-yellow-500 text-black px-2 py-1 rounded text-xs">Beta</span>;
      case 'coming-soon': return <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs">Coming Soon</span>;
      default: return <span className="bg-gray-500 text-white px-2 py-1 rounded text-xs">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingScreenDots />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400 mb-4">Error loading news: {error}</p>
        <button 
          onClick={fetchNews}
          className="bg-[#00ffe7] text-[#181a23] px-4 py-2 rounded hover:bg-[#ff005c] hover:text-white transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 mb-8 relative max-w-7xl mx-auto">
      {/* Header and Controls */}
      <div className="mb-2">
        <h2 className="text-center">
          {contentType === 'news' ? 'Trading bots updates in the media' : 'Dexter CityPlatform Updates'}
        </h2>
      </div>

      {/* Content Type Toggle */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <div className="flex border border-[#00ffe7]/30 rounded-lg overflow-hidden">
          <button
            onClick={() => setContentType('news')}
            className={`px-4 py-2 font-semibold transition-all duration-200 ${
              contentType === 'news'
                ? 'bg-[#00ffe7] text-[#181a23]'
                : 'bg-[#23263a] text-[#e0e7ef] hover:bg-[#00ffe7]/20'
            }`}
          >
            <FaNewspaper className="inline mr-2" />
            Media News
          </button>
          <button
            onClick={() => setContentType('updates')}
            className={`px-4 py-2 font-semibold transition-all duration-200 ${
              contentType === 'updates'
                ? 'bg-[#00ffe7] text-[#181a23]'
                : 'bg-[#23263a] text-[#e0e7ef] hover:bg-[#00ffe7]/20'
            }`}
          >
            <FaCode className="inline mr-2" />
            Platform Updates
          </button>
        </div>
      </div>


          {/* Toggle and Filter Controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setShowTicker(!showTicker)}
              className="flex items-center gap-2 bg-[#00ffe7] text-[#181a23] px-4 py-2 rounded hover:bg-[#ff005c] hover:text-white transition-all duration-200 font-semibold"
            >
              {showTicker ? <FaChevronUp /> : <FaChevronDown />}
              {showTicker ? 'Hide Posts' : 'Show Posts'}
            </button>

            <div className="flex gap-3">
              {/* Filter */}
              <div className="flex items-center gap-2">
                <FaFilter className="text-[#00ffe7]" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="bg-[#23263a] text-[#e0e7ef] border border-[#00ffe7]/30 rounded px-3 py-1 text-sm"
                >
                  <option value="all">All Sources</option>
                  <option value="youtube">YouTube</option>
                  <option value="twitter">Twitter</option>
                </select>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <FaSort className="text-[#00ffe7]" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'engagement')}
                  className="bg-[#23263a] text-[#e0e7ef] border border-[#00ffe7]/30 rounded px-3 py-1 text-sm"
                >
                  <option value="date">Latest</option>
                  <option value="engagement">Most Engaging</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sliding Ticker Overlay */}
          <div 
            className={`
              absolute top-full left-0 right-0 z-50 
              transition-all duration-500 ease-in-out
              ${showTicker 
                ? 'opacity-100 transform translate-y-0 visible' 
                : 'opacity-0 transform -translate-y-4 invisible'
              }
            `}
          >
            {filteredAndSortedNews.length === 0 ? (
              <div className="text-center py-8 text-[#e0e7ef] bg-[#23263a] border border-[#00ffe7]/30 rounded-lg">
                No news items found for the selected filter.
              </div>
            ) : (
              <>
                {/* Ticker Container */}
                <div 
                  className="relative overflow-hidden py-4 border border-[#00ffe7]/20 rounded-lg bg-[#181a23]/95 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,255,231,0.3)]"
                  style={{ height: '320px' }}
                  onMouseEnter={() => setIsPaused(true)}
                  onMouseLeave={() => setIsPaused(false)}
                >
                  {/* Close button */}
                  <button
                    onClick={() => setShowTicker(false)}
                    className="absolute top-2 right-2 z-10 bg-[#ff005c] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs hover:bg-[#ff3380] transition"
                  >
                    ✕
                  </button>

                  {/* Ticker Track */}
                  <div 
                    className={`flex gap-6 ${isPaused ? '' : 'animate-ticker'}`}
                    style={{
                      width: `${(filteredAndSortedNews.length * 2) * 350}px`
                    }}
                  >
                    {/* First set of items */}
                    {filteredAndSortedNews.map((item, index) => (
                      <div
                        key={`first-${item.native_id || index}`}
                        className="flex-shrink-0 w-80 cursor-pointer transition-all duration-300 hover:scale-105"
                        onClick={() => item.post_urls.length > 0 && window.open(item.post_urls[0], '_blank')}
                      >
                        <div className="bg-[#23263a] border border-[#00ffe7]/30 rounded-lg p-4 h-72 overflow-hidden hover:shadow-[0_0_16px_#00ffe7] transition-all duration-300">
                          {/* Header */}
                          <div className="flex items-start gap-3 mb-3">
                            <img
                              src={item.author.profile_image_url}
                              alt={item.author.name}
                              className="w-8 h-8 rounded-full border border-[#00ffe7]/50 flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-[#00ffe7] text-sm truncate">{item.author.name}</h3>
                                {item.author.verified && <span className="text-blue-400 text-xs">✓</span>}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-[#e0e7ef]">
                                {getSourceIcon(item.sourcetype)}
                                <span>{formatDate(item.date)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Content */}
                          {item.content && (
                            <p className="text-[#e0e7ef] mb-3 h-12 leading-relaxed text-sm line-clamp-4">
                              {truncateContent(item.content, 120)}
                            </p>
                          )}

                          {/* Media */}
                          {item.media_urls.length > 0 && (
                            <div className="mb-3">
                              <img
                                src={item.media_urls[0]}
                                alt="Post media"
                                className="w-full h-20 object-cover rounded-lg border border-[#00ffe7]/30"
                              />
                            </div>
                          )}

                          {/* Hashtags */}
                          {item.hashtags.length > 0 ? (
                            <div className="mb-3">
                              <div className="flex flex-wrap gap-1">
                                {item.hashtags.slice(0, 2).map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="text-[#00ffe7] text-xs bg-[#181a23] px-2 py-1 rounded"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                                {item.hashtags.length > 2 && (
                                  <span className="text-[#b8eaff] text-xs">
                                    +{item.hashtags.length - 2}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="mb-3">
                              <span className="text-xs text-gray-400 bg-[#181a23] px-2 py-1 rounded">
                                no hashtags
                              </span>
                            </div>
                          )}

                          {/* Metrics */}
                          <div className="flex items-center justify-between pt-2 border-t border-[#00ffe7]/20 mt-auto">
                            <div className="flex items-center gap-2 text-xs text-[#b8eaff]">
                              {item.sourcetype === 'youtube' && item.metrics.youtube && (
                                <>
                                  <div className="flex items-center gap-1">
                                    <FaEye />
                                    <span>{formatNumber(item.metrics.youtube.views)}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <FaHeart />
                                    <span>{formatNumber(item.metrics.youtube.likes)}</span>
                                  </div>
                                </>
                              )}
                              
                              {item.sourcetype === 'twitter' && item.metrics.twitter && (
                                <>
                                  <div className="flex items-center gap-1">
                                    <FaRetweet />
                                    <span>{formatNumber(item.metrics.twitter.retweet_count)}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <FaHeart />
                                    <span>{formatNumber(item.metrics.twitter.like_count)}</span>
                                  </div>
                                </>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <span className={`text-xs ${getSentimentColor(item.metrics.sentiment)}`}>
                                {item.metrics.sentiment > 0 ? '+' : ''}{item.metrics.sentiment}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Second set of items for seamless loop */}
                    {filteredAndSortedNews.map((item, index) => (
                      <div
                        key={`second-${item.native_id || index}`}
                        className="flex-shrink-0 w-80 cursor-pointer transition-all duration-300 hover:scale-105"
                        onClick={() => item.post_urls.length > 0 && window.open(item.post_urls[0], '_blank')}
                      >
                        <div className="bg-[#23263a] border border-[#00ffe7]/30 rounded-lg p-4 h-64 overflow-hidden hover:shadow-[0_0_16px_#00ffe7] transition-all duration-300">
                          {/* Header */}
                          <div className="flex items-start gap-3 mb-3">
                            <img
                              src={item.author.profile_image_url}
                              alt={item.author.name}
                              className="w-8 h-8 rounded-full border border-[#00ffe7]/50 flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-[#00ffe7] text-sm truncate">{item.author.name}</h3>
                                {item.author.verified && <span className="text-blue-400 text-xs">✓</span>}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-[#e0e7ef]">
                                {getSourceIcon(item.sourcetype)}
                                <span>{formatDate(item.date)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Content */}
                          {item.content && (
                            <p className="text-[#e0e7ef] mb-3 leading-relaxed text-sm line-clamp-4">
                              {truncateContent(item.content, 120)}
                            </p>
                          )}

                          {/* Media */}
                          {item.media_urls.length > 0 && (
                            <div className="mb-3">
                              <img
                                src={item.media_urls[0]}
                                alt="Post media"
                                className="w-full h-20 object-cover rounded-lg border border-[#00ffe7]/30"
                              />
                            </div>
                          )}

                          {/* Hashtags */}
                          {item.hashtags.length > 0 && (
                            <div className="mb-3">
                              <div className="flex flex-wrap gap-1">
                                {item.hashtags.slice(0, 2).map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="text-[#00ffe7] text-xs bg-[#181a23] px-2 py-1 rounded"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                                {item.hashtags.length > 2 && (
                                  <span className="text-[#b8eaff] text-xs">
                                    +{item.hashtags.length - 2}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Metrics */}
                          <div className="flex items-center justify-between pt-2 border-t border-[#00ffe7]/20 mt-auto">
                            <div className="flex items-center gap-2 text-xs text-[#b8eaff]">
                              {item.sourcetype === 'youtube' && item.metrics.youtube && (
                                <>
                                  <div className="flex items-center gap-1">
                                    <FaEye />
                                    <span>{formatNumber(item.metrics.youtube.views)}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <FaHeart />
                                    <span>{formatNumber(item.metrics.youtube.likes)}</span>
                                  </div>
                                </>
                              )}
                              
                              {item.sourcetype === 'twitter' && item.metrics.twitter && (
                                <>
                                  <div className="flex items-center gap-1">
                                    <FaRetweet />
                                    <span>{formatNumber(item.metrics.twitter.retweet_count)}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <FaHeart />
                                    <span>{formatNumber(item.metrics.twitter.like_count)}</span>
                                  </div>
                                </>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <span className={`text-xs ${getSentimentColor(item.metrics.sentiment)}`}>
                                {item.metrics.sentiment > 0 ? '+' : ''}{item.metrics.sentiment}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ticker control indicator */}
                <div className="flex justify-center mt-2">
                  <span className="text-xs text-[#b8eaff] opacity-70 bg-[#181a23]/80 px-2 py-1 rounded">
                    {isPaused ? '⏸️ Hover to pause' : '▶️ Auto-scrolling ticker'}
                  </span>
                </div>
              </>
            )}
            
          </div>

        
        <div className="bg-[#23263a] border border-[#00ffe7]/30 rounded-lg p-6">
          <div className="space-y-4">
            {platformUpdates.map((update, index) => (
              <div key={index} className="bg-[#181a23] border border-[#00ffe7]/20 rounded-lg p-4 hover:shadow-[0_0_16px_#00ffe7]/30 transition-all duration-300">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${getUpdateTypeColor(update.type)} rounded-lg flex items-center justify-center text-white font-bold`}>
                      {getUpdateTypeIcon(update.type)}
                    </div>
                    <div>
                      <h3 className="text-[#00ffe7] font-bold text-lg">{update.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[#faafe8] font-semibold">{update.version}</span>
                        <span className="text-[#e0e7ef] text-sm">{new Date(update.date).toLocaleDateString()}</span>
                        {getStatusBadge(update.status)}
                      </div>
                    </div>
                  </div>
                </div>
                
                <p className="text-[#e0e7ef] leading-relaxed">{update.description}</p>
                
                <div className="mt-3 flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs text-white ${getUpdateTypeColor(update.type)}`}>
                    {update.type.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          {platformUpdates.length === 0 && (
            <div className="text-center py-8 text-[#e0e7ef]">
              No platform updates available.
            </div>
          )}
        </div>

    </div>
  );
};

export default NewsUpdates;
