import type { Event } from '@/types/espn/scoreboard';
import type { PlayNfl } from '@/types/espn/plays';

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

const formatGameTime = (event: Event, competition: any): string => {
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

const computeNbaRun = (playLog: PlayNfl[], homeTeamId?: string, awayTeamId?: string) => {
  if (!homeTeamId || !awayTeamId || !Array.isArray(playLog) || playLog.length === 0) return null;

  const scoringPlays = playLog.filter(play => {
    const points = Number(play?.scoreValue ?? 0);
    const teamId = play?.team || play?.possession;
    return points > 0 && !!teamId;
  });

  if (scoringPlays.length === 0) return null;

  const latest = scoringPlays[0];
  const latestElapsed = elapsedGameSeconds(Number(latest.quarter || 0), latest.clock || '0:00');

  const windowPlays = scoringPlays.filter(play => {
    const elapsed = elapsedGameSeconds(Number(play.quarter || 0), play.clock || '0:00');
    return latestElapsed - elapsed <= RUN_WINDOW_SECONDS;
  });

  if (windowPlays.length === 0) return null;

  const totals: Record<string, number> = {};
  windowPlays.forEach(play => {
    const teamId = play.team || play.possession;
    if (!teamId) return;
    const points = Number(play.scoreValue || 0);
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
    ...windowPlays.map(play => elapsedGameSeconds(Number(play.quarter || 0), play.clock || '0:00'))
  );
  const durationSeconds = Math.max(5, latestElapsed - earliestElapsed);

  return {
    teamId: runTeamId,
    runPoints,
    oppPoints,
    durationLabel: formatDuration(durationSeconds)
  };
};

export const updateOpenGraphMeta = (event: Event | null, league: string, playLog: PlayNfl[] = []) => {
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

  const awayLabel = away.team.abbreviation || away.team.shortDisplayName || away.team.displayName;
  const homeLabel = home.team.abbreviation || home.team.shortDisplayName || home.team.displayName;
  const gameTime = formatGameTime(event, competition);

  let runText = '';
  if (league === 'nba' && playLog.length > 0) {
    const homeTeamId = home?.id || home?.team?.id;
    const awayTeamId = away?.id || away?.team?.id;
    const run = computeNbaRun(playLog, String(homeTeamId || ''), String(awayTeamId || ''));
    const runTeam = run ? (run.teamId === String(homeTeamId) ? home : away) : null;
    if (run && runTeam) {
      const runLabel = runTeam.team?.abbreviation || runTeam.team?.shortDisplayName || runTeam.team?.displayName || '';
      runText = runLabel ? `Run ${runLabel} ${run.runPoints}-${run.oppPoints} (${run.durationLabel})` : '';
    }
  }

  const titleParts = [
    `${awayLabel} vs ${homeLabel}`,
    `${awayScore}-${homeScore}`,
    gameTime,
    runText
  ].filter(Boolean);

  const title = titleParts.join(', ');
  const description = 'Touchdown helps you be the best manager and climb to the top with live game insights, picks, and predictions.';

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
