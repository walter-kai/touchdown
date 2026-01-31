import axios from 'axios';
import { PlayNfl, PlayAthlete } from '@/types/espn/plays';
import { getPlaysUrl } from './espnApi';

export const extractAthleteIdFromRef = (ref?: string): string => {
  if (!ref || typeof ref !== 'string') return '';
  const sanitized = ref.split('?')[0];
  const parts = sanitized.split('/').filter(Boolean);
  return parts[parts.length - 1] || '';
};

const extractIdFromRef = (ref?: string): string => extractAthleteIdFromRef(ref);

const resolveTeamId = (teamObj?: any, fallback?: string): string => {
  if (!teamObj) return fallback || '';
  return teamObj.id || extractIdFromRef(teamObj.$ref) || fallback || '';
};

const normalizeParticipants = (
  rawPlay: any,
  headshotLookup?: Map<string, string>,
  getHeadshotUrl?: (opts: { id?: string | number; headshot?: string | { href?: string } | null } | null | undefined) => string
): PlayAthlete[] => {
  const participants = rawPlay?.participants || rawPlay?.athletesInvolved || [];
  const seen = new Set<string>();

  return participants
    .map((participant: any) => {
      if (!participant) return null;
      
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
      const resolvedHeadshot = getHeadshotUrl ? getHeadshotUrl({ id, headshot: headshotHref }) : headshotLookup?.get(id) || '';

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
            extractIdFromRef(participant?.team?.$ref) ||
            resolveTeamId(rawPlay?.start?.team) ||
            resolveTeamId(rawPlay?.team) ||
            rawPlay?.possession ||
            ''
        }
      } as PlayAthlete;
    })
    .filter(Boolean) as PlayAthlete[];
};

const TYPE_ID_MAP: Record<string, string> = {
  '2': 'Pass Reception',
  '3': 'Pass Incompletion',
  '4': 'Rush',
  '5': 'Rushing Touchdown',
  '6': 'Passing Touchdown',
  '7': 'Field Goal Good',
  '8': 'Field Goal Missed',
  '9': 'Punt',
  '10': 'Kickoff',
  '11': 'Penalty',
  '12': 'Sack',
  '13': 'Pass Interception Return',
  '14': 'Fumble Recovery (Own)',
  '15': 'Fumble Recovery (Opponent)',
  '16': 'Official Timeout',
  '17': 'Two-minute warning',
  '18': 'End Period',
  '19': 'End of Half',
  '20': 'End of Game',
  '24': 'Rush',
  '25': 'Pass',
  '26': 'Run',
  '53': 'Kickoff'
};

export const normalizePlayFromItem = (
  rawPlay: any,
  fallbackDate?: string | Date,
  headshotLookup?: Map<string, string>,
  getHeadshotUrl?: (opts: { id?: string | number; headshot?: string | { href?: string } | null } | null | undefined) => string
): PlayNfl => {
  const textBlob = rawPlay?.text || rawPlay?.shortText || rawPlay?.alternativeText || '';
  const teamParticipants = rawPlay?.teamParticipants || rawPlay?.participants || [];
  const offenseTeamId =
    rawPlay?.team?.id ||
    extractIdFromRef(rawPlay?.team?.$ref) ||
    teamParticipants.find((p: any) => p?.type === 'offense')?.id ||
    resolveTeamId(rawPlay?.start?.team) ||
    resolveTeamId(rawPlay?.possession) ||
    rawPlay?.possession?.id ||
    rawPlay?.possession;

  const startTeamId = resolveTeamId(rawPlay?.start?.team, offenseTeamId);
  const endTeamId = resolveTeamId(rawPlay?.end?.team, offenseTeamId);

  const period = rawPlay?.period?.number ?? rawPlay?.period ?? 0;
  const clock = rawPlay?.clock?.displayValue ?? rawPlay?.clock ?? '';
  const possession = offenseTeamId || undefined;
  const typeId = rawPlay?.type?.id ? String(rawPlay.type.id) : undefined;
  const type =
    rawPlay?.type?.text ||
    rawPlay?.type?.displayName ||
    (typeId ? TYPE_ID_MAP[typeId] : undefined) ||
    rawPlay?.type?.abbreviation ||
    rawPlay?.type?.description ||
    textBlob ||
    'Play';
  const timestamp = rawPlay?.wallclock || fallbackDate || new Date();
  const yardLine = rawPlay?.start?.yardLine ?? rawPlay?.end?.yardLine;
  const yardage =
    typeof rawPlay?.statYardage === 'number'
      ? rawPlay.statYardage
      : rawPlay?.yardsGained ?? rawPlay?.yardage;

  const normalizedStart = rawPlay?.start
    ? {
        ...rawPlay.start,
        team: rawPlay.start?.team || startTeamId ? { id: startTeamId } : undefined
      }
    : undefined;

  const normalizedEnd = rawPlay?.end
    ? {
        ...rawPlay.end,
        team: rawPlay.end?.team || endTeamId ? { id: endTeamId || startTeamId } : undefined
      }
    : undefined;

  return {
    id: rawPlay?.id,
    text: textBlob || rawPlay?.description || '',
    quarter: period,
    clock,
    timestamp: new Date(timestamp),
    possession,
    team: resolveTeamId(rawPlay?.team, offenseTeamId) || rawPlay?.offensiveTeamId || possession,
    type,
    scoreValue: rawPlay?.scoreValue || rawPlay?.score || 0,
    yardLine,
    yardage,
    start: normalizedStart,
    end: normalizedEnd,
    athletesInvolved: normalizeParticipants(rawPlay, headshotLookup, getHeadshotUrl),
    // NBA-specific fields
    coordinate: rawPlay?.coordinate,
    period: rawPlay?.period,
    shootingPlay: rawPlay?.shootingPlay,
    scoringPlay: rawPlay?.scoringPlay,
    pointsAttempted: rawPlay?.pointsAttempted,
    possessionTeam: rawPlay?.possessionTeam,
    participants: rawPlay?.participants
  } as any;
};

export const fetchEspnPlays = async (
  gameId: string,
  competitionId?: string,
  headshotLookup?: Map<string, string>,
  league: 'nfl' | 'nba' = 'nfl',
  getHeadshotUrl?: (opts: { id?: string | number; headshot?: string | { href?: string } | null } | null | undefined) => string
): Promise<PlayNfl[]> => {
  const compId = competitionId || gameId;

  // Fetch plays from ESPN API
  const url = getPlaysUrl(league, gameId, compId);
  const res = await axios.get(url);
  const data = res.data;

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
    .map((p: any) => normalizePlayFromItem(p, data?.gameDate, headshotLookup, getHeadshotUrl))
    .filter((p: PlayNfl) => Boolean(p.text));

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
