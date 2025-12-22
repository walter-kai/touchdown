import axios from 'axios';
import { Play, PlayAthlete } from '@/types/espn/playByplay';
import { getHeadshotUrl } from '@/utils/headshot';

export const extractAthleteIdFromRef = (ref?: string): string => {
  if (!ref || typeof ref !== 'string') return '';
  const sanitized = ref.split('?')[0];
  const parts = sanitized.split('/').filter(Boolean);
  return parts[parts.length - 1] || '';
};

const normalizeParticipants = (
  rawPlay: any,
  headshotLookup?: Map<string, string>
): PlayAthlete[] => {
  const participants = rawPlay?.participants || rawPlay?.athletesInvolved || [];
  const seen = new Set<string>();

  return participants
    .map((participant: any) => {
      const athlete = participant.athlete || participant.player || participant;
      const id =
        athlete?.id ||
        extractAthleteIdFromRef(athlete?.$ref) ||
        extractAthleteIdFromRef(participant?.athlete?.$ref) ||
        '';

      if (!id) return null;
      if (seen.has(id)) return null;
      seen.add(id);

      const headshotHref =
        athlete?.headshot?.href ||
        athlete?.headshot ||
        participant?.headshot?.href ||
        participant?.headshot;
      const resolvedHeadshot = getHeadshotUrl({ id, headshot: headshotHref }) || headshotLookup?.get(id) || '';

      const pos =
        athlete?.position?.abbreviation ||
        athlete?.position?.displayName ||
        (typeof athlete?.position === 'string' ? athlete.position : '') ||
        (typeof participant?.position === 'string' ? participant.position : '') ||
        '';

      return {
        id,
        displayName: athlete?.displayName || athlete?.shortName || 'Unknown Player',
        shortName: athlete?.shortName || athlete?.lastName || athlete?.displayName,
        fullName: athlete?.fullName || athlete?.displayName,
        position: pos,
        jersey: athlete?.jersey || participant?.jersey || '',
        headshot: resolvedHeadshot,
        team: {
          id:
            participant?.team?.id ||
            rawPlay?.start?.team?.id ||
            rawPlay?.team?.id ||
            rawPlay?.possession ||
            ''
        }
      } as PlayAthlete;
    })
    .filter(Boolean) as PlayAthlete[];
};

export const normalizePlayFromItem = (
  rawPlay: any,
  fallbackDate?: string | Date,
  headshotLookup?: Map<string, string>
): Play => {
  const period = rawPlay?.period?.number ?? rawPlay?.period ?? 0;
  const clock = rawPlay?.clock?.displayValue ?? rawPlay?.clock ?? '';
  const possession =
    rawPlay?.start?.team?.id ||
    rawPlay?.team?.id ||
    rawPlay?.possession?.id ||
    rawPlay?.possession ||
    undefined;
  const type =
    rawPlay?.type?.text ||
    rawPlay?.type?.displayName ||
    rawPlay?.type?.id ||
    rawPlay?.type ||
    'Play';
  const timestamp = rawPlay?.wallclock || fallbackDate || new Date();
  const yardLine = rawPlay?.start?.yardLine ?? rawPlay?.end?.yardLine;
  const yardage =
    typeof rawPlay?.statYardage === 'number'
      ? rawPlay.statYardage
      : rawPlay?.yardsGained ?? rawPlay?.yardage;

  return {
    id: rawPlay?.id,
    text: rawPlay?.text || rawPlay?.shortText || rawPlay?.description || '',
    quarter: period,
    clock,
    timestamp: new Date(timestamp),
    possession,
    team: rawPlay?.team?.id || rawPlay?.offensiveTeamId || possession,
    type,
    scoreValue: rawPlay?.scoreValue || rawPlay?.score || 0,
    yardLine,
    yardage,
    start: rawPlay?.start,
    end: rawPlay?.end,
    athletesInvolved: normalizeParticipants(rawPlay, headshotLookup)
  };
};

export const fetchEspnPlays = async (
  gameId: string,
  competitionId?: string,
  headshotLookup?: Map<string, string>
): Promise<Play[]> => {
  const compId = competitionId || gameId;

  // ESPN sometimes requires the league path; try multiple URLs to avoid 404s
  const candidateUrls = [
    `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/${gameId}/competitions/${compId}/plays?limit=300&lang=en&region=us`,
    `https://sports.core.api.espn.com/v2/sports/football/nfl/events/${gameId}/competitions/${compId}/plays?limit=300&lang=en&region=us`
  ];

  let data: any | undefined;
  let lastError: unknown;

  for (const url of candidateUrls) {
    try {
      const res = await axios.get(url);
      data = res.data;
      break;
    } catch (err) {
      lastError = err;
    }
  }

  if (!data) {
    throw lastError ?? new Error('Unable to fetch plays from ESPN');
  }

  const items = data?.items || [];

  const plays = await Promise.all(
    items.map(async (item: any) => {
      if (item?.text || item?.description) return item;
      if (item?.$ref) {
        try {
          const res = await axios.get(item.$ref);
          return res.data;
        } catch (err) {
          console.warn('Failed to follow play ref', item.$ref, err);
          return null;
        }
      }
      return item;
    })
  );

  const normalized = plays
    .filter((p): p is any => Boolean(p))
    .map((p: any) => normalizePlayFromItem(p, data?.gameDate, headshotLookup))
    .filter((p: Play) => Boolean(p.text));

  // Sort by true game order (latest first): period, clock, fallback to timestamp
  const clockToSeconds = (clock: string) => {
    const parts = clock.split(':').map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return Number.isFinite(Number(clock)) ? Number(clock) : 0;
  };

  normalized.sort((a, b) => {
    const periodA = a.quarter ?? 0;
    const periodB = b.quarter ?? 0;
    const clockSecA = clockToSeconds(a.clock || '0:00');
    const clockSecB = clockToSeconds(b.clock || '0:00');

    // Higher period first; within period smaller clock = later in that period
    if (periodA !== periodB) return periodB - periodA;
    if (clockSecA !== clockSecB) return clockSecA - clockSecB;

    // Fallback to timestamp if available
    const ta = new Date(a.timestamp).getTime();
    const tb = new Date(b.timestamp).getTime();
    return tb - ta;
  });

  return normalized;
};
