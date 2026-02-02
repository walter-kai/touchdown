import { Metadata } from 'next';
import { getEventApiUrl, getSummaryUrl, getPlaysUrl } from '../../../../src/utils/espnApi';
import GamePageClient from '@/pages/GamePageClient';

export const dynamic = 'force-dynamic';
export const revalidate = 300;

const DEFAULT_IMAGE = 'https://touchdown-882290629693.us-central1.run.app/logos/opengraph.jpg';

const NBA_REGULATION_SECONDS = 12 * 60;
const NBA_OT_SECONDS = 5 * 60;
const RUN_WINDOW_SECONDS = 240; // 4 minutes of game time

const clockToSeconds = (clock: string): number => {
  if (!clock) return 0;
  const parts = clock.split(':').map(part => Number(part));
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return Number.isFinite(Number(clock)) ? Number(clock) : 0;
};

const elapsedGameSeconds = (quarter: number, clock: string): number => {
  const q = Number.isFinite(quarter) && quarter > 0 ? quarter : 1;
  const clockSeconds = clockToSeconds(clock);
  const periodLength = q <= 4 ? NBA_REGULATION_SECONDS : NBA_OT_SECONDS;
  const boundedClock = Math.max(0, Math.min(periodLength, clockSeconds));
  let elapsed = 0;
  for (let p = 1; p < q; p += 1) {
    elapsed += p <= 4 ? NBA_REGULATION_SECONDS : NBA_OT_SECONDS;
  }
  return elapsed + (periodLength - boundedClock);
};

const formatDuration = (totalSeconds: number): string => {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, '0')}`;
};

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

const computeNbaRunFromRawPlays = (plays: any[], homeTeamId?: string, awayTeamId?: string) => {
  if (!homeTeamId || !awayTeamId || !Array.isArray(plays) || plays.length === 0) return null;

  const scoringPlays = plays.filter(play => {
    const points = Number(play?.scoreValue ?? play?.score ?? 0);
    const teamId = play?.team?.id || play?.team || play?.possession?.id || play?.possession;
    return points > 0 && !!teamId;
  });

  if (scoringPlays.length === 0) return null;

  const latest = scoringPlays[0];
  const latestElapsed = elapsedGameSeconds(
    Number(latest?.period?.number ?? latest?.period ?? 0),
    latest?.clock?.displayValue ?? latest?.clock ?? '0:00'
  );

  const windowPlays = scoringPlays.filter(play => {
    const elapsed = elapsedGameSeconds(
      Number(play?.period?.number ?? play?.period ?? 0),
      play?.clock?.displayValue ?? play?.clock ?? '0:00'
    );
    return latestElapsed - elapsed <= RUN_WINDOW_SECONDS;
  });

  if (windowPlays.length === 0) return null;

  const totals: Record<string, number> = {};
  windowPlays.forEach(play => {
    const teamId = play?.team?.id || play?.team || play?.possession?.id || play?.possession;
    if (!teamId) return;
    const points = Number(play?.scoreValue ?? play?.score ?? 0);
    if (!Number.isFinite(points) || points <= 0) return;
    totals[teamId] = (totals[teamId] || 0) + points;
  });

  const homePoints = totals[homeTeamId] || 0;
  const awayPoints = totals[awayTeamId] || 0;
  if (homePoints === awayPoints || (homePoints === 0 && awayPoints === 0)) return null;

  const runTeamId = homePoints > awayPoints ? homeTeamId : awayTeamId;
  const runPoints = runTeamId === homeTeamId ? homePoints : awayPoints;
  const oppPoints = runTeamId === homeTeamId ? awayPoints : homePoints;

  const earliestElapsed = Math.min(
    ...windowPlays.map(play => elapsedGameSeconds(
      Number(play?.period?.number ?? play?.period ?? 0),
      play?.clock?.displayValue ?? play?.clock ?? '0:00'
    ))
  );
  const durationSeconds = Math.max(5, latestElapsed - earliestElapsed);

  return {
    teamId: runTeamId,
    runPoints,
    oppPoints,
    durationLabel: formatDuration(durationSeconds)
  };
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
    const summaryUrl = getSummaryUrl('nba', gameId);
    const summaryData = await fetchJson(summaryUrl);

    const competitionFromSummary = summaryData?.header?.competitions?.[0];
    const eventFromSummary = summaryData?.header;

    const eventUrl = getEventApiUrl('nba', gameId);
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
          url: `https://touchdown-882290629693.us-central1.run.app/nba/game/${gameId}`,
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
    const homeTeamId = String(homeTeam?.id || homeTeam?.team?.id || '');
    const awayTeamId = String(awayTeam?.id || awayTeam?.team?.id || '');
    let runText = '';

    if (competition?.status?.type?.state === 'in') {
      try {
        const playsUrl = getPlaysUrl('nba', gameId, competition?.id || gameId);
        const playsData = await fetchJson(playsUrl);
        const items = Array.isArray(playsData?.items) ? playsData.items : [];
        const recentItems = items.slice(0, 120);
        const resolved = await Promise.all(
          recentItems.map(async (item: any) => (item?.$ref ? await fetchJson(item.$ref) : item))
        );
        const run = computeNbaRunFromRawPlays(resolved.filter(Boolean), homeTeamId, awayTeamId);
        const runTeam = run ? (run.teamId === homeTeamId ? homeTeam : awayTeam) : null;
        if (run && runTeam) {
          const runLabel = runTeam?.team?.abbreviation || runTeam?.team?.shortDisplayName || runTeam?.team?.displayName || '';
          if (runLabel) {
            runText = `Run ${runLabel} ${run.runPoints}-${run.oppPoints} (${run.durationLabel})`;
          }
        }
      } catch {
        // Ignore run calculation errors
      }
    }

    // Construct metadata
    const titleParts = [
      `${awayTeamAbbr} vs ${homeTeamAbbr}`,
      `${awayScore}-${homeScore}`,
      gameTime || eventDate,
      runText
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
      openGraph: {
        title: 'Game | Touchdown',
        description: 'Watch the game on Touchdown - Live sports picks and analysis',
        type: 'website',
        url: `https://touchdown-882290629693.us-central1.run.app/nba/game/${gameId}`,
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

export default async function NBAGamePage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await params;

  return <GamePageClient league="nba" gameId={gameId} />;
}
