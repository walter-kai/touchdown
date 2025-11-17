import React, { useEffect, useState } from 'react';
import { FaExternalLinkAlt } from 'react-icons/fa';
import LoadingScreenDots from '../../components/common/LoadingScreenDots';
import NewsFetcher from '../../components/landing/NewsFetcher';
import LinkPreviewCard from '../../components/blog/LinkPreviewCard';

interface PlatformUpdate {
  version: string;
  date: string;
  title: string;
  description: string;
  type: 'feature' | 'improvement' | 'bugfix' | 'securcity' | 'major' | 'team' | 'roadmap';
  status: 'released' | 'beta' | 'coming-soon';
  link?: string | null;
  linkText?: string;
  image?: string;
}

const Blog: React.FC = () => {
  const [platformUpdates, setPlatformUpdates] = useState<PlatformUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlatformUpdates();
  }, []);

  const fetchPlatformUpdates = async () => {
    try {
      const response = await fetch('/blog/blog.json');
      const updates = await response.json();
      setPlatformUpdates(updates);
    } catch (err) {
      console.error('Error fetching platform updates:', err);
    } finally {
      setLoading(false);
    }
  };

  const getUpdateTypeIcon = (type: string) => {
    switch (type) {
      case 'feature': return '🚀';
      case 'improvement': return '⚡';
      case 'bugfix': return '🐛';
      case 'security': return '🔒';
      case 'major': return '💎';
      case 'team': return '👥';
      case 'roadmap': return '🗺️';
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
      case 'team': return 'bg-indigo-500';
      case 'roadmap': return 'bg-orange-500';
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
      <div
        className="fixed inset-0 flex flex-col items-center justify-center bg-[#181a23] bg-gradient-to-br from-[#181a23] via-[#23263a] to-[#1a1a2e] z-10"
        style={{
          width: '100vw',
          maxWidth: '100vw',
          overflowX: 'clip',
          boxSizing: 'border-box',
          padding: 0,
        }}
      >
        <div className="max-w-5xl w-full flex flex-col items-center px-4">
          <h1 className="text-4xl font-bold text-[#00ffe7] mb-12 drop-shadow-[0_0_8px_#00ffe7] tracking-widest text-center">
            Blog
          </h1>
          <LoadingScreenDots />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-0 bg-[#181a23] bg-gradient-to-br from-[#181a23] via-[#23263a] to-[#1a1a2e] overflow-hidden animate-fade-in-up">
      {/* Neon background glow */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[80vw] h-[60vh] bg-[#00ffe7]/10 blur-3xl rounded-full" />
        <div className="absolute right-0 bottom-0 w-[40vw] h-[40vh] bg-[#faafe8]/10 blur-2xl rounded-full" />
      </div>
      {/* Main scrollable area */}
      <div
        className="relative z-10 w-full h-full flex justify-center items-start"
      >
        <div
          className="w-full h-screen flex justify-center custom-scrollbar"
          style={{
            WebkitOverflowScrolling: 'touch',
            overflowY: 'auto',
          }}
        >
          <div className=" h-fit">
            <div className="max-w-6xl w-full px-4 py-12 my-12 mx-auto ">
              <div className="bg-[#181a23]/80 border-2 border-[#00ffe7]/30 rounded-3xl shadow-[0_0_32px_#00ffe7]/20 backdrop-blur-md p-8 relative overflow-hidden">
                {/* Neon border corners */}
                <span className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-[#00ffe7] rounded-tl-3xl opacity-70 animate-pulse" />
                <span className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-[#00ffe7] rounded-tr-3xl opacity-70 animate-pulse" />
                <span className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-[#00ffe7] rounded-bl-3xl opacity-70 animate-pulse" />
                <span className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-[#00ffe7] rounded-br-3xl opacity-70 animate-pulse" />
                <h1 className="text-5xl font-extrabold text-[#00ffe7] mb-10 drop-shadow-[0_0_16px_#00ffe7] tracking-widest text-center neon-text">
                  Blog
                </h1>
                <p className="text-2xl text-[#faafe8] mb-10 text-center max-w-2xl mx-auto font-medium">
                  Latest news, platform updates, and community highlights from Dexter City.
                </p>
                <div className="flex flex-col gap-12 w-full">
            {/* News Section */}
            {/* <div className="w-full bg-[#23263a]/80 border border-[#00ffe7]/20 rounded-2xl p-6 mb-8 shadow-[0_0_12px_#00ffe7]/10 passport-card overflow-hidden backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-[#00ffe7] mb-6 text-center drop-shadow-[0_0_8px_#00ffe7] tracking-wide">
                Media & News
              </h2>
              <div>
                <NewsFetcher />
              </div>
            </div> */}
            {/* Platform Updates Section */}
            <div className="w-full bg-[#23263a]/80 border border-[#00ffe7]/20 rounded-2xl p-6 shadow-[0_0_12px_#00ffe7]/10 passport-card overflow-hidden backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-[#00ffe7] mb-6 text-center drop-shadow-[0_0_8px_#00ffe7] tracking-wide">
                Platform Updates
              </h2>
              <div className="space-y-8">
                {platformUpdates.map((update, index) => (
                  <div key={index} className="relative bg-[#181a23]/90 border border-[#00ffe7]/20 rounded-lg p-6 hover:shadow-[0_0_24px_#00ffe7]/30 transition-all duration-300 mb-4 passport-card overflow-hidden">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 ${getUpdateTypeColor(update.type)} rounded-lg flex items-center justify-center text-white text-2xl font-bold shadow-[0_0_8px_#00ffe7]/30`}>
                    {getUpdateTypeIcon(update.type)}
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                <h3 className="text-[#00ffe7] mr-2 text-left font-bold text-xl">{update.title}</h3>
                {getStatusBadge(update.status)}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                <span className="text-[#faafe8] font-semibold">{update.version}</span>
                <span className="text-[#e0e7ef] text-sm">{new Date(update.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Always display description */}
              <div className="mb-4">
                {update.image ? (
                  <div className="flex min-h-[128px] gap-4 mb-4">
                    <img
                src={update.image}
                alt={update.title}
                className="w-48 h-32 object-cover flex-shrink-0 rounded-lg border border-[#00ffe7]/30 shadow-[0_0_8px_#00ffe7]/10"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
                    />
                    <div className="flex-1 flex flex-col justify-center">
                <p className="text-[#e0e7ef] leading-relaxed">{update.description}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-[#e0e7ef] leading-relaxed mb-4">{update.description}</p>
                )}
                {/* Display link preview or simple link */}
                {update.link && (
                  <div className="mb-4">
                    {update.image ? (
                <a
                  href={update.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#00ffe7] hover:underline flex items-center gap-2 text-sm"
                >
                  {update.linkText || "View Full Details"} <FaExternalLinkAlt className="text-xs" />
                </a>
                    ) : (
                <LinkPreviewCard url={update.link} />
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs text-white ${getUpdateTypeColor(update.type)}`}>
                  {update.type.toUpperCase()}
                </span>
              </div>
              {/* Neon HUD corners */}
              <span className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#00ffe7] rounded-tl-2xl opacity-60 animate-pulse" />
              <span className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#00ffe7] rounded-tr-2xl opacity-60 animate-pulse" />
              <span className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#00ffe7] rounded-bl-2xl opacity-60 animate-pulse" />
              <span className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#00ffe7] rounded-br-2xl opacity-60 animate-pulse" />
                  </div>
                ))}
                {platformUpdates.length === 0 && (
                  <div className="text-center py-8 text-[#e0e7ef]">
              No platform updates available.
                  </div>
                )}
              </div>
            </div>
          </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Blog;
