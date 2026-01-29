import { Metadata } from 'next';

interface Props {
  params: {
    gameId: string;
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { gameId } = params;
  
  try {
    // Fetch game data from ESPN API
    const summaryUrl = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=${gameId}`;
    const response = await fetch(summaryUrl);
    const data = await response.json();
    
    const header = data?.header;
    const competition = header?.competitions?.[0];
    const homeTeam = competition?.competitors?.find((c: any) => c.homeAway === 'home');
    const awayTeam = competition?.competitors?.find((c: any) => c.homeAway === 'away');
    
    const title = `Pick Now: ${awayTeam?.team?.displayName || 'Away'} vs ${homeTeam?.team?.displayName || 'Home'}`;
    const gameDate = new Date(competition?.date || Date.now()).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
    
    const description = `Make your picks for ${awayTeam?.team?.displayName} vs ${homeTeam?.team?.displayName} - ${gameDate}`;
    
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        url: `https://touchdown-882290629693.us-central1.run.app/nba/game/${gameId}`,
        images: [
          {
            url: homeTeam?.team?.logo || 'https://touchdown-882290629693.us-central1.run.app/logos/opengraph.jpg',
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [homeTeam?.team?.logo || 'https://touchdown-882290629693.us-central1.run.app/logos/opengraph.jpg'],
      },
    };
  } catch (error) {
    // Fallback metadata
    return {
      title: 'Touchdown - NBA Game',
      description: 'View game details and make your picks',
    };
  }
}

export default async function NBAGamePage({ params }: Props) {
  // Render the React Router app which will handle this route
  const { default: Home } = await import('../../../page');
  return <Home />;
}
