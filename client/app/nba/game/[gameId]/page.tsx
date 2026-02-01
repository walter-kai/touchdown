import { Metadata } from 'next';
import { getEventApiUrl } from '../../../../src/utils/espnApi';
import GamePageClient from '../../../../src/views/GamePageClient';

export async function generateMetadata({ params }: { params: Promise<{ gameId: string }> }): Promise<Metadata> {
  const gameId = (await params).gameId;

  try {
    const url = getEventApiUrl('nba', gameId);
    const response = await fetch(url, { next: { revalidate: 300 } });

    if (!response.ok) {
      throw new Error(`Failed to fetch game data: ${response.status}`);
    }

    const gameData = await response.json();
    const event = gameData.events?.[0];

    if (!event) {
      return {
        title: 'Game | Touchdown',
        description: 'Watch the game on Touchdown - Live sports picks and analysis',
      };
    }

    // Extract team and game info
    const competitors = event.competitions?.[0]?.competitors || [];
    const homeTeam = competitors.find((c: any) => c.homeAway === 'home');
    const awayTeam = competitors.find((c: any) => c.homeAway === 'away');
    const status = event.competitions?.[0]?.status?.type;
    const competition = event.competitions?.[0];

    const homeTeamName = homeTeam?.team?.displayName || 'Home Team';
    const awayTeamName = awayTeam?.team?.displayName || 'Away Team';
    const homeTeamLogo = homeTeam?.team?.logo || '';
    const awayTeamLogo = awayTeam?.team?.logo || '';

    const homeScore = homeTeam?.score || 0;
    const awayScore = awayTeam?.score || 0;

    // Construct metadata
    const title = `${awayTeamName} @ ${homeTeamName} | Touchdown`;
    const description = `${awayTeamName} vs ${homeTeamName} - Live NBA game analysis and picks on Touchdown`;

    // Use team logo as OG image or fallback
    let ogImage = homeTeamLogo || 'https://touchdown-882290629693.us-central1.run.app/logos/opengraph.jpg';
    if (competition?.images?.[0]?.url) {
      ogImage = competition.images[0].url;
    }

    return {
      title,
      description,
      metadataBase: new URL('https://touchdown-882290629693.us-central1.run.app'),
      openGraph: {
        title,
        description,
        type: 'website',
        url: `https://touchdown-882290629693.us-central1.run.app/nba/game/${gameId}`,
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: `${awayTeamName} vs ${homeTeamName}`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImage],
      },
    };
  } catch (error) {
    console.error('Error generating metadata for NBA game:', error);
    return {
      title: 'Game | Touchdown',
      description: 'Watch the game on Touchdown - Live sports picks and analysis',
    };
  }
}

export default async function NBAGamePage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await params;

  return <GamePageClient league="nba" gameId={gameId} />;
}
