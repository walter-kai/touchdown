import { Metadata } from 'next';
import { getEventApiUrl, getSummaryUrl } from '../../../../src/utils/espnApi';
import GamePageClient from '@/pages/GamePageClient';

export const dynamic = 'force-dynamic';
export const revalidate = 300;

const DEFAULT_IMAGE = 'https://touchdown-882290629693.us-central1.run.app/logos/opengraph.jpg';

const fetchJson = async (url: string) => {
  try {
    const response = await fetch(url, {
      next: { revalidate: 300 },
      headers: {
        'User-Agent': 'TouchdownBot/1.0',
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  }
};

export async function generateMetadata({ params }: { params: Promise<{ gameId: string }> }): Promise<Metadata> {
  const { gameId } = await params;

  try {
    const summaryUrl = getSummaryUrl('nfl', gameId);
    const summaryData = await fetchJson(summaryUrl);

    const competitionFromSummary = summaryData?.header?.competitions?.[0];
    const eventFromSummary = summaryData?.header;

    const eventUrl = getEventApiUrl('nfl', gameId);
    const eventData = summaryData ? null : await fetchJson(eventUrl);
    const eventFromEvents = eventData?.events?.[0];

    const competition = competitionFromSummary || eventFromEvents?.competitions?.[0];
    const event = eventFromEvents || eventFromSummary;

    if (!event || !competition) {
      return {
        title: 'Game | Touchdown',
        description: 'Watch the game on Touchdown - Live sports picks and analysis',
        openGraph: {
          title: 'Game | Touchdown',
          description: 'Watch the game on Touchdown - Live sports picks and analysis',
          type: 'website',
          url: `https://touchdown-882290629693.us-central1.run.app/nfl/game/${gameId}`,
          images: [
            {
              url: DEFAULT_IMAGE,
              width: 1200,
              height: 630,
              alt: 'Touchdown Game',
            },
          ],
        },
        twitter: {
          card: 'summary_large_image',
          title: 'Game | Touchdown',
          description: 'Watch the game on Touchdown - Live sports picks and analysis',
          images: [DEFAULT_IMAGE],
        },
      };
    }

    // Extract team and game info
    const competitors = competition?.competitors || [];
    const homeTeam = competitors.find((c: any) => c.homeAway === 'home');
    const awayTeam = competitors.find((c: any) => c.homeAway === 'away');

    const homeTeamName = homeTeam?.team?.displayName || 'Home Team';
    const awayTeamName = awayTeam?.team?.displayName || 'Away Team';
    const homeTeamLogo = homeTeam?.team?.logo || '';
    const awayTeamLogo = awayTeam?.team?.logo || '';

    // Construct metadata
    const title = `${awayTeamName} @ ${homeTeamName} | Touchdown`;
    const description = `${awayTeamName} vs ${homeTeamName} - Live NFL game analysis and picks on Touchdown`;

    // Use team logo as OG image or fallback
    let ogImage = homeTeamLogo || awayTeamLogo || DEFAULT_IMAGE;
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
        url: `https://touchdown-882290629693.us-central1.run.app/nfl/game/${gameId}`,
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
    console.error('Error generating metadata for NFL game:', error);
    return {
      title: 'Game | Touchdown',
      description: 'Watch the game on Touchdown - Live sports picks and analysis',
      openGraph: {
        title: 'Game | Touchdown',
        description: 'Watch the game on Touchdown - Live sports picks and analysis',
        type: 'website',
        url: `https://touchdown-882290629693.us-central1.run.app/nfl/game/${gameId}`,
        images: [
          {
            url: DEFAULT_IMAGE,
            width: 1200,
            height: 630,
            alt: 'Touchdown Game',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Game | Touchdown',
        description: 'Watch the game on Touchdown - Live sports picks and analysis',
        images: [DEFAULT_IMAGE],
      },
    };
  }
}

export default async function NFLGamePage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await params;

  return <GamePageClient league="nfl" gameId={gameId} />;
}
