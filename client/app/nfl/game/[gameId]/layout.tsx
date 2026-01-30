import { Metadata } from 'next';

// Fetch game data server-side to generate metadata
async function getGameData(gameId: string) {
  try {
    const response = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/football/nfl/events/${gameId}`,
      { next: { revalidate: 60 } } // Cache for 60 seconds
    );
    
    if (!response.ok) {
      return null;
    }
    
    const text = await response.text();
    if (!text) {
      return null;
    }
    
    try {
      return JSON.parse(text);
    } catch (parseError) {
      return null;
    }
  } catch (error) {
    console.error('Failed to fetch game data for metadata:', error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ gameId: string }> }): Promise<Metadata> {
  const { gameId } = await params;
  const event = await getGameData(gameId);

  if (!event) {
    return {
      title: 'Game | Touchdown',
      description: 'Watch the game on Touchdown - Live sports picks and analysis',
    };
  }

  const competition = event.competitions?.[0];
  if (!competition) {
    return {
      title: 'Game | Touchdown',
      description: 'Watch the game on Touchdown - Live sports picks and analysis',
    };
  }

  const competitors = competition.competitors || [];
  const away = competitors.find((c: any) => c.homeAway === 'away');
  const home = competitors.find((c: any) => c.homeAway === 'home');

  if (!away || !home) {
    return {
      title: 'Game | Touchdown',
      description: 'Watch the game on Touchdown - Live sports picks and analysis',
    };
  }

  const awayScore = away.score !== undefined ? Number(away.score) : 0;
  const homeScore = home.score !== undefined ? Number(home.score) : 0;
  const status = competition.status?.type?.state;
  
  const gameDate = new Date(event.date);
  const dateStr = gameDate.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });

  let title = '';
  let description = '';

  if (status === 'post') {
    title = `${away.team.displayName} ${awayScore} - ${homeScore} ${home.team.displayName} | FINAL | ${dateStr}`;
    description = `Final Score: ${away.team.displayName} ${awayScore}, ${home.team.displayName} ${homeScore}. View full game stats, highlights, and analysis on Touchdown.`;
  } else if (status === 'in') {
    const period = competition.status?.period || 1;
    const clock = competition.status?.displayClock || '';
    title = `${away.team.displayName} ${awayScore} - ${homeScore} ${home.team.displayName} | LIVE Q${period} ${clock} | ${dateStr}`;
    description = `Live now! ${away.team.displayName} ${awayScore}, ${home.team.displayName} ${homeScore}. Follow the action in real-time on Touchdown.`;
  } else {
    const now = new Date();
    const gameTime = new Date(event.date);
    const diff = gameTime.getTime() - now.getTime();
    
    let timeUntilText = 'Starting Soon';
    if (diff > 0) {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        timeUntilText = `Starts in ${days}d ${hours}h`;
      } else if (hours > 0) {
        timeUntilText = `Starts in ${hours}h ${minutes}m`;
      } else if (minutes > 0) {
        timeUntilText = `Starts in ${minutes}m`;
      }
    }
    
    title = `${away.team.displayName} vs ${home.team.displayName} | ${timeUntilText} | ${dateStr}`;
    description = `${away.team.displayName} face off against ${home.team.displayName} ${timeUntilText}. Make your picks and join the action on Touchdown!`;
  }

  const image = 'https://touchdown-882290629693.us-central1.run.app/logos/opengraph.jpg';
  const metaTitle = 'Touchdown - Manage your players, rack up points!';
  const metaDescription = 'Manage your players, rack up points! Fantasy sports picks and predictions for NFL, NBA and more';

  return {
    title: metaTitle,
    description: metaDescription,
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      images: [
        {
          url: image,
          width: 1600,
          height: 630,
          alt: 'Touchdown - Manage your players, rack up points!',
        },
      ],
      type: 'website',
      url: `https://touchdown-882290629693.us-central1.run.app/nfl/game/${gameId}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
      images: [image],
    },
    other: {
      'og:logo': 'https://touchdown-882290629693.us-central1.run.app/logos/Drive-logo.png',
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
