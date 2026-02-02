import { Metadata } from 'next';
import { getEventApiUrl, getSummaryUrl } from '../../../../src/utils/espnApi';
import GamePageClient from '@/pages/GamePageClient';

export const dynamic = 'force-dynamic';
export const revalidate = 300;

const DEFAULT_IMAGE = 'https://touchdown-882290629693.us-central1.run.app/logos/opengraph.jpg';

const formatGameTime = (event: any, competition: any): string => {
  const state = competition?.status?.type?.state;
  if (state === 'in') {
    const period = competition?.status?.period || 1;
    const clock = competition?.status?.displayClock || '';
    return `${`Q${period}`} ${clock}`.trim();
  }
  if (state === 'post') return 'Final';
  if (state === 'pre') {
    const eventDate = event?.date ? new Date(event.date) : null;
    return eventDate
      ? eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      : (competition?.status?.type?.description || 'Scheduled');
  }
  return competition?.status?.type?.description || '';
};

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
    const homeTeamAbbr = homeTeam?.team?.abbreviation || homeTeam?.team?.shortDisplayName || 'HOME';
    const awayTeamAbbr = awayTeam?.team?.abbreviation || awayTeam?.team?.shortDisplayName || 'AWAY';
    const homeTeamLogo = homeTeam?.team?.logo || '';
    const awayTeamLogo = awayTeam?.team?.logo || '';
    const homeScore = homeTeam?.score || '0';
    const awayScore = awayTeam?.score || '0';
    const eventDate = event?.date ? new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
    const gameTime = formatGameTime(event, competition);

    // Construct metadata
    const titleParts = [
      `${awayTeamAbbr} vs ${homeTeamAbbr}`,
      `${awayScore}-${homeScore}`,
      gameTime || eventDate
    ].filter(Boolean);
    const title = titleParts.join(', ');
    const description = 'Touchdown helps you be the best manager and climb to the top with live game insights, picks, and predictions.';

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
