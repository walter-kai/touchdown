import type { Event } from '@/types/espn/scoreboard';

export const updateOpenGraphMeta = (event: Event | null, league: string) => {
  if (!event) {
    // Remove OG tags if no event
    removeOpenGraphMeta();
    return;
  }

  const competition = event.competitions?.[0];
  if (!competition) return;

  const competitors = competition.competitors || [];
  const away = competitors.find((c: any) => c.homeAway === 'away');
  const home = competitors.find((c: any) => c.homeAway === 'home');

  if (!away || !home) return;

  // Calculate time until game starts
  const now = new Date();
  const gameTime = new Date(event.date);
  const diff = gameTime.getTime() - now.getTime();
  
  let timeUntilText = '';
  if (diff > 0) {
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      timeUntilText = `${days}d ${hours}h`;
    } else if (hours > 0) {
      timeUntilText = `${hours}h ${minutes}m`;
    } else {
      timeUntilText = `${minutes}m`;
    }
  } else {
    // Game is live or finished
    const status = competition.status?.type?.state;
    if (status === 'in') {
      timeUntilText = 'LIVE';
    } else if (status === 'post') {
      timeUntilText = 'FINAL';
    }
  }

  // Build title with date
  const gameDate = new Date(event.date);
  const dateStr = gameDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const title = `Pick Now: ${away.team.displayName} vs ${home.team.displayName}, ${dateStr}`;

  // Build description
  const description = `Watch ${away.team.displayName} face off against ${home.team.displayName} (starts in ${timeUntilText}). Play fantasy sports with real-time updates and manage your picks on Touchdown. Join your friends in the ultimate sports experience!`;

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
  const selector = property.startsWith('twitter:') 
    ? `meta[name="${property}"]`
    : `meta[property="${property}"]`;

  let tag = document.querySelector(selector) as HTMLMetaElement;

  if (!tag) {
    tag = document.createElement('meta');
    if (property.startsWith('twitter:')) {
      tag.setAttribute('name', property);
    } else {
      tag.setAttribute('property', property);
    }
    document.head.appendChild(tag);
  }

  tag.content = content;
};

const removeOpenGraphMeta = () => {
  const ogProperties = ['og:title', 'og:description', 'og:image', 'og:url', 'og:type'];
  const twitterProperties = ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image'];

  [...ogProperties, ...twitterProperties].forEach((prop) => {
    const selector = prop.startsWith('twitter:')
      ? `meta[name="${prop}"]`
      : `meta[property="${prop}"]`;
    const tag = document.querySelector(selector);
    if (tag) {
      tag.remove();
    }
  });
};
