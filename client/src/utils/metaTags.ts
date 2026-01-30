import type { Event } from '@/types/espn/scoreboard';

export const updateOpenGraphMeta = (event: Event | null, league: string) => {
  // Safety check - ensure we're in browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  if (!event) {
    removeOpenGraphMeta();
    return;
  }

  const competition = event.competitions?.[0];
  if (!competition) return;

  const competitors = competition.competitors || [];
  const away = competitors.find((c: any) => c.homeAway === 'away');
  const home = competitors.find((c: any) => c.homeAway === 'home');

  if (!away || !home) return;

  // Get scores
  const awayScore = away.score !== undefined ? Number(away.score) : 0;
  const homeScore = home.score !== undefined ? Number(home.score) : 0;

  // Calculate time until game starts
  const now = new Date();
  const gameTime = new Date(event.date);
  const diff = gameTime.getTime() - now.getTime();
  const gameDate = new Date(event.date);
  const dateStr = gameDate.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
  
  let timeUntilText = '';
  let title = '';
  let description = '';
  const status = competition.status?.type?.state;

  if (status === 'post') {
    // Game finished - show final score
    timeUntilText = 'FINAL';
    title = `${away.team.displayName} ${awayScore} - ${homeScore} ${home.team.displayName} | ${timeUntilText} | ${dateStr}`;
    description = `Final Score: ${away.team.displayName} ${awayScore}, ${home.team.displayName} ${homeScore}. View full game stats, highlights, and analysis on Touchdown.`;
  } else if (status === 'in') {
    // Game in progress - show live score
    timeUntilText = 'LIVE';
    const period = competition.status?.period || 1;
    const clock = competition.status?.displayClock || '';
    title = `${away.team.displayName} ${awayScore} - ${homeScore} ${home.team.displayName} | ${timeUntilText} Q${period} ${clock} | ${dateStr}`;
    description = `Live now! ${away.team.displayName} ${awayScore}, ${home.team.displayName} ${homeScore}. Follow the action in real-time on Touchdown.`;
  } else {
    // Game hasn't started - show countdown
    if (diff > 0) {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        timeUntilText = `Starts in ${days}d ${hours}h`;
      } else if (hours > 0) {
        timeUntilText = `Starts in ${hours}h ${minutes}m`;
      } else {
        timeUntilText = `Starts in ${minutes}m`;
      }
    } else {
      timeUntilText = 'Starting Soon';
    }
    title = `${away.team.displayName} vs ${home.team.displayName} | ${timeUntilText} | ${dateStr}`;
    description = `${away.team.displayName} face off against ${home.team.displayName} ${timeUntilText}. Make your picks and join the action on Touchdown!`;
  }

  // Use team logo or a generic image
  const image = home.team.logo || `https://a.espncdn.com/media/motion/2024/1009/dm_240924_nfl_logo.png`;

  // Update document title
  document.title = title;

  // Update or create OG meta tags
  updateMetaTag('og:title', title);
  updateMetaTag('og:description', description);
  updateMetaTag('og:image', image);
  updateMetaTag('og:url', window.location.href);
  updateMetaTag('og:type', 'website');
  updateMetaTag('twitter:card', 'summary_large_image');
  updateMetaTag('twitter:title', title);
  updateMetaTag('twitter:description', description);
  updateMetaTag('twitter:image', image);
};

const updateMetaTag = (property: string, content: string) => {
  // Safety check - ensure document and head exist
  if (typeof document === 'undefined' || !document.head) {
    return;
  }

  try {
    const selector = property.startsWith('twitter:') 
      ? `meta[name="${property}"]`
      : `meta[property="${property}"]`;

    let tag = document.querySelector(selector) as HTMLMetaElement;

    if (!tag) {
      // Double check head still exists before creating new element
      if (!document.head) return;
      
      tag = document.createElement('meta');
      if (property.startsWith('twitter:')) {
        tag.setAttribute('name', property);
      } else {
        tag.setAttribute('property', property);
      }
      
      // Triple check before appending - prevent null parent errors
      if (document.head && document.head.parentNode) {
        document.head.appendChild(tag);
      } else {
        return; // Abort if head is being removed
      }
    }

    // Only update content if tag still exists and has a parent
    if (tag && tag.parentNode) {
      tag.content = content;
    }
  } catch (error) {
    // Silently fail to prevent breaking the app
    console.warn(`Failed to update meta tag ${property}:`, error);
  }
};

const removeOpenGraphMeta = () => {
  // Instead of removing, update to default values to avoid removeChild errors
  if (typeof document === 'undefined') {
    return;
  }

  try {
    // Update to default values instead of removing
    updateMetaTag('og:title', 'Touchdown - Live Sports Picks');
    updateMetaTag('og:description', 'Make your picks and compete with friends in real-time sports action');
    updateMetaTag('og:image', 'https://a.espncdn.com/media/motion/2024/1009/dm_240924_nfl_logo.png');
    updateMetaTag('og:url', window.location.href);
    updateMetaTag('og:type', 'website');
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', 'Touchdown - Live Sports Picks');
    updateMetaTag('twitter:description', 'Make your picks and compete with friends in real-time sports action');
    updateMetaTag('twitter:image', 'https://a.espncdn.com/media/motion/2024/1009/dm_240924_nfl_logo.png');
  } catch (error) {
    // Silently ignore errors
  }
};
