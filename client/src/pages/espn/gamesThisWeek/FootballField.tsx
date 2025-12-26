import React from 'react';
import { FaFootballBall } from 'react-icons/fa';
import { Play, PlayTypeNFL, NflPositionType } from '@/types/espn/playByplay';
import '@/styles/football.css';
import { useLeague } from '@/providers/LeagueContext';
import { usePlays } from '@/providers/PlaysContext';

interface FootballFieldProps {
  homeTeam?: any;
  awayTeam?: any;
  // Optional orientation overrides provided by parent
  leftTeamOverride?: any;
  rightTeamOverride?: any;
  lastPlay?: {
    id?: string;
    possession?: string;
    start?: { yardLine?: number };
    end?: { yardLine?: number };
    team?: { id?: string };
    type?: {
      id?: string;
      text?: string;
      abbreviation?: string;
    };
    athletesInvolved?: Array<{
      id?: string;
      displayName?: string;
      headshot?: string;
      shortName?: string;
      position?: string;
      team?: { id?: string };
    }>;
    text?: string;
  };
  situation?: {
    downDistanceText?: string;
    possession?: string;
    awayTimeouts?: number;
    homeTimeouts?: number;
    yardLine?: number;
    lastPlay?: {
      possession?: string;
    };
  };
  playLog?: Play[];
  getTeamLogo: (team: any) => string;
  showGameInfo?: boolean;
}

// Play visualization config
const getPlayVisualization = (playType?: PlayTypeNFL | string | { text: string }) => {
  // Handle both string and object types - ensure we always have a string
  let typeStr = '';
  if (typeof playType === 'string') {
    typeStr = playType;
  } else if (playType && typeof playType === 'object' && 'text' in playType) {
    typeStr = playType.text || '';
  }
  // Force to string and lowercase
  const type = String(typeStr || '').toLowerCase();
  
  // Touchdowns - animate like underlying play
  if (type.includes('touchdown')) {
    const isPassTd = type.includes('pass') || type.includes('reception');
    const isRushTd = type.includes('rush') || type.includes('run');
    if (isPassTd) {
      return {
        color: '#00FFE7',
        glowColor: 'rgba(0, 255, 231, 0.6)',
        icon: '🏆',
        pattern: 'solid',
        width: 2,
        animate: 'pass-complete'
      };
    }
    if (isRushTd) {
      return {
        color: '#FAAFE8',
        glowColor: 'rgba(250, 175, 232, 0.6)',
        icon: '🏆',
        pattern: 'solid',
        width: 2,
        animate: 'rush'
      };
    }
    return {
      color: '#FFD700',
      glowColor: 'rgba(255, 215, 0, 0.6)',
      icon: '🏆',
      pattern: 'dashed',
      width: 4,
      animate: 'pulse'
    };
  }
  
  // Interceptions - Red
  if (type.includes('interception')) {
    return {
      color: '#FF3333',
      glowColor: 'rgba(255, 51, 51, 0.6)',
      icon: '🔴',
      pattern: 'solid',
      width: 3,
      animate: 'flash'
    };
  }
  
  // Fumbles - Orange (distinguish between rush and pass fumbles)
  if (type.includes('fumble')) {
    const isRushFumble = type.includes('rush') || type.includes('run') || type.includes('left') || type.includes('right') || type.includes('middle') || type.includes('tackle') || type.includes('guard') || type.includes('end');
    return {
      color: '#FF8800',
      glowColor: 'rgba(255, 136, 0, 0.6)',
      icon: '⚠️',
      pattern: 'solid',
      width: 3,
      animate: isRushFumble ? 'fumble-rush' : 'fumble'
    };
  }
  
  // Sacks - Dark Red with X overlay
  if (type.includes('sack')) {
    return {
      color: '#CC0000',
      glowColor: 'rgba(204, 0, 0, 0.6)',
      icon: '💥',
      pattern: 'solid',
      width: 3,
      animate: 'sack'
    };
  }
  
  // Field Goals - Green/Purple with trajectory
  if (type.includes('field goal')) {
    const isGood = type.includes('good');
    return {
      color: isGood ? '#00FF00' : '#9333EA',
      glowColor: isGood ? 'rgba(0, 255, 0, 0.6)' : 'rgba(147, 51, 234, 0.6)',
      icon: isGood ? '✅' : '❌',
      pattern: 'dotted',
      width: 3,
      animate: 'field-goal'
    };
  }
  
  // Penalties - Yellow flag with greyscale
  if (type.includes('penalty')) {
    return {
      color: '#FFFF00',
      glowColor: 'rgba(255, 255, 0, 0.6)',
      icon: '�🏻‍♂️',
      pattern: 'dashed',
      width: 2,
      animate: 'penalty'
    };
  }
  
  // Pass plays - Cyan with football arc
  if (type.includes('pass')) {
    const isComplete = type.includes('reception');
    return {
      color: isComplete ? '#00FFE7' : '#666666',
      glowColor: isComplete ? 'rgba(0, 255, 231, 0.6)' : 'rgba(102, 102, 102, 0.4)',
      icon: isComplete ? '📨' : '📭',
      pattern: 'solid',
      width: 2,
      animate: isComplete ? 'pass-complete' : 'pass-incomplete'
    };
  }
  
  // Rush plays - Pink/Purple with slide animation
  if (type.includes('rush')) {
    return {
      color: '#FAAFE8',
      glowColor: 'rgba(250, 175, 232, 0.6)',
      icon: '🏃',
      pattern: 'solid',
      width: 2,
      animate: 'rush'
    };
  }
  
  // Punt - Light Blue with high arc, red if out of bounds
  if (type.includes('punt')) {
    const isFail = type.includes('out of bounds') || type.includes('penalty');
    return {
      color: isFail ? '#FF3333' : '#87CEEB',
      glowColor: isFail ? 'rgba(255, 51, 51, 0.6)' : 'rgba(135, 206, 235, 0.6)',
      icon: isFail ? '🚫' : '🦶',
      pattern: 'dotted',
      width: 2,
      animate: isFail ? 'kickoff-fail' : 'punt'
    };
  }
  
  // Kickoff - Blue with arc, red if out of bounds/touchback fail
  if (type.includes('kickoff')) {
    const isFail = type.includes('out of bounds') || type.includes('penalty') || type.includes('touchback');
    return {
      color: isFail ? '#FF3333' : '#4169E1',
      glowColor: isFail ? 'rgba(255, 51, 51, 0.6)' : 'rgba(65, 105, 225, 0.6)',
      icon: isFail ? '🚫' : '⚡',
      pattern: 'dotted',
      width: 2,
      animate: isFail ? 'kickoff-fail' : 'kickoff'
    };
  }
  
  // Timeout - Spinning clock
  if (type.includes('timeout')) {
    return {
      color: '#FFD700',
      glowColor: 'rgba(255, 215, 0, 0.6)',
      icon: '',
      pattern: 'solid',
      width: 2,
      animate: 'timeout'
    };
  }
  
  // Two Minute Warning - reuse timeout animation for consistency
  if (type.includes('two-minute warning') || type.includes('two minute warning')) {
    return {
      color: '#FFD700',
      glowColor: 'rgba(255, 215, 0, 0.6)',
      icon: '',
      pattern: 'solid',
      width: 2,
      animate: 'timeout'
    };
  }
  
  // End of Regulation - Pulsing end symbol
  if (type.includes('end of') && (type.includes('quarter') || type.includes('half') || type.includes('regulation') || type.includes('game'))) {
    return {
      color: '#FF6B6B',
      glowColor: 'rgba(255, 107, 107, 0.8)',
      icon: '✅',
      pattern: 'solid',
      width: 1,
      animate: 'end-regulation'
    };
  }
  
  // Default - Cyan
  return {
    color: '#00FFE7',
    glowColor: 'rgba(0, 255, 231, 0.6)',
    icon: '⬇️',
    pattern: 'solid',
    width: 2,
    animate: 'none'
  };
};

const FootballField: React.FC<FootballFieldProps> = ({
  homeTeam: homeTeamProp,
  awayTeam: awayTeamProp,
  leftTeamOverride,
  rightTeamOverride,
  lastPlay: lastPlayProp,
  situation: situationProp,
  playLog: playLogProp = [],
  getTeamLogo,
  showGameInfo = false,
}) => {
  const { getHeadshotUrl } = useLeague();
  const getTeamId = (team: any) => {
    if (!team) return undefined;
    if (typeof team === 'string') return team;
    return team.id ?? team.team?.id;
  };
  const getStartYard = (play: any) => {
    const yard = play?.start?.yardLine ?? play?.yardLine;
    return typeof yard === 'number' ? yard : undefined;
  };
  const getEndYard = (play: any) => {
    const yard = play?.end?.yardLine;
    return typeof yard === 'number' ? yard : undefined;
  };
  const getPlayId = (play: any) => (typeof play?.id === 'string' ? play.id : play?.id) as string | undefined;
  const getPlayTypeText = (play: any) => {
    if (!play?.type) return '';
    if (typeof play.type === 'string') return play.type;
    return play.type.text || play.type.displayName || play.type.abbreviation || '';
  };

  const homeTeam = homeTeamProp;
  const awayTeam = awayTeamProp;
  const homeAbbrRaw = homeTeam?.team?.abbreviation?.toUpperCase() || homeTeam?.abbreviation?.toUpperCase() || homeTeam?.shortDisplayName?.toUpperCase();
  const awayAbbrRaw = awayTeam?.team?.abbreviation?.toUpperCase() || awayTeam?.abbreviation?.toUpperCase() || awayTeam?.shortDisplayName?.toUpperCase();
  const { playLog: contextPlayLog = [] } = usePlays();
  const playLog = playLogProp?.length ? playLogProp : (contextPlayLog || []);
  const lastPlay = (lastPlayProp ?? playLog[0]) as Partial<Play> | undefined;
  const fallbackPossession = getTeamId((lastPlay as any)?.team)
    || (lastPlay as any)?.possession
    || (lastPlay as any)?.athletesInvolved?.[0]?.team?.id;
  const situation = (situationProp as any) ?? (lastPlay
    ? {
        possession: fallbackPossession,
        lastPlay: { possession: fallbackPossession },
        yardLine: getStartYard(lastPlay) ?? getEndYard(lastPlay),
      }
    : undefined);



  // If we still don't have core data from context or props, don't render an empty shell
  if (!homeTeam || !awayTeam || !situation) return null;
  const fieldRef = React.useRef<HTMLDivElement>(null);
  const [kickPhaseComplete, setKickPhaseComplete] = React.useState(false);
  const [kickDone, setKickDone] = React.useState(false);
  const offenseAthleteId = (lastPlay as any)?.athletesInvolved?.[0]?.id;
  const offenseTeamId = situation?.possession
    || (situation?.lastPlay as any)?.possession
    || getTeamId((lastPlay as any)?.team)
    || (lastPlay as any)?.possession
    || (playLog[0] as any)?.possession
    || (lastPlay as any)?.athletesInvolved?.[0]?.team?.id;
  const [returnStarted, setReturnStarted] = React.useState(false);
  const [ballFade, setBallFade] = React.useState(false);
  const [loopCycle, setLoopCycle] = React.useState(0);
  const debugLogs = false;

  const [viewportWidth, setViewportWidth] = React.useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Normalize team abbreviations for yard conversions
  const abbrMatches = (abbr?: string, target?: string) => {
    if (!abbr || !target) return false;
    const a = abbr.toUpperCase();
    const b = target.toUpperCase();
    if (a === b) return true;
    // handle shortened city codes like LA vs LAR
    if (a.length === 2 && b.startsWith(a)) return true;
    if (b.length === 2 && a.startsWith(b)) return true;
    return false;
  };
  
  // Trapezoid field geometry (top narrower than bottom)
  const TRAPEZOID_TOP_INSET = 16; // percent inset on each side at the top edge for stronger angle
  const trapezoidBottomInset = React.useMemo(() => {
    const baseInset = -112; // design inset at reference width
    const referenceWidth = 1280; // px baseline for taper calculation
    const minInset = -12;
    const maxInset = -1028;
    const scaled = baseInset * (viewportWidth / referenceWidth);
    return Math.max(maxInset, Math.min(minInset, scaled));
  }, [viewportWidth]);
  const BASE_LEFT_PERCENT = 0; // use full trapezoid width so yard lines align with edges
  const BASE_WIDTH_PERCENT = 100; // full playable span projected to the trapezoid

  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const projectTrapezoidX = (basePercent: number, depth: number) => {
    const t = clamp01(depth);
    const leftEdge = lerp(TRAPEZOID_TOP_INSET, trapezoidBottomInset, t);
    const rightEdge = lerp(100 - TRAPEZOID_TOP_INSET, 100 - trapezoidBottomInset, t);
    const width = rightEdge - leftEdge;
    return leftEdge + clamp01(basePercent) * width;
  };

  const yardToBasePercent = (yard: number) => {
    const clamped = Math.max(-10, Math.min(110, yard));
    return (BASE_LEFT_PERCENT + clamped * (BASE_WIDTH_PERCENT / 100)) / 100;
  };

  const projectYardX = (yard: number, depthPercent: number) => {
    const depth = clamp01(depthPercent / 100);
    return projectTrapezoidX(yardToBasePercent(yard), depth);
  };

  // Single source of truth for vertical depth positions (expressed as 0-1)
  const ARROW_DEPTH = 0.30; // slightly above mid-plane
  const HEADSHOT_DEPTH = 0.64; // lower on the surface
  const NUMBER_DEPTH = 0.70; // yard numbers near the front edge
  const arrowTopPercent = ARROW_DEPTH * 100;
  const headshotTopPercent = HEADSHOT_DEPTH * 100;
  const numberTopPercent = NUMBER_DEPTH * 100;
  const arrowX = (yard: number | undefined, depthPercent = arrowTopPercent) => projectYardX(yard ?? 0, depthPercent);
  const headshotX = (yard: number | undefined, depthPercent = headshotTopPercent) => projectYardX(yard ?? 0, depthPercent);
  // Duration of rush animation (matches rush-slide timing)
  const RUSH_ANIMATION_MS = 3000;
  const PASS_PAUSE_MS = 2000;
  const PLAY_END_DELAY_MS = 600;
  const clampYard = (yard: number) => Math.max(0, Math.min(100, yard));
  const fieldWidthPx = fieldRef.current?.offsetWidth || 1000;
  
  if (!lastPlay) return null;
  // Determine initial orientation using the coin toss (receiver starts on the left driving left-to-right)
  const matchTeamFromText = (text?: string) => {
    const upper = (text || '').toUpperCase();
    if (homeTeam?.team?.displayName && upper.includes(homeTeam.team.displayName.toUpperCase())) return homeTeam;
    if (awayTeam?.team?.displayName && upper.includes(awayTeam.team.displayName.toUpperCase())) return awayTeam;
    if (homeAbbrRaw && upper.includes(homeAbbrRaw)) return homeTeam;
    if (awayAbbrRaw && upper.includes(awayAbbrRaw)) return awayTeam;
    if (homeTeam?.shortDisplayName && upper.includes(homeTeam.shortDisplayName.toUpperCase())) return homeTeam;
    if (awayTeam?.shortDisplayName && upper.includes(awayTeam.shortDisplayName.toUpperCase())) return awayTeam;
    return undefined;
  };

  const coinTossPlay = React.useMemo(() => {
    return (playLog || []).find((p: any) => {
      const typeId = typeof p?.type?.id === 'string' ? p.type.id : String(p?.type?.id || '');
      const typeText = (p?.type?.text || '').toLowerCase();
      const fullText = (p?.text || '').toLowerCase();
      return typeId === '70' || typeText.includes('coin toss') || fullText.includes('coin toss');
    });
  }, [playLog]);

  // Parse coin toss to determine which team is receiving (gets ball first)
  const receiverTeam = React.useMemo(() => {
    if (!coinTossPlay) return undefined;
    const tossText = (coinTossPlay.text || '').toUpperCase();
    
    // Find which team won the toss or made the decision
    const mentionedTeam = matchTeamFromText(tossText);
    if (!mentionedTeam) return undefined;

    // Check if they elected to receive
    const elects = tossText.includes('ELECT');
    const receives = tossText.includes('RECEIVE') || tossText.includes('RECIEVE');
    
    if (elects && receives) {
      return mentionedTeam; // This team elected to receive
    }

    // If they deferred, the other team receives
    if (tossText.includes('DEFER')) {
      return mentionedTeam.id === homeTeam?.id ? awayTeam : homeTeam;
    }

    return undefined;
  }, [coinTossPlay, homeTeam, awayTeam]);

  // Standard TV convention: away team on left, home team on right
  // Switch sides at Q3 (3rd quarter). Allow parent overrides to take precedence.
  const currentQuarter = lastPlay?.quarter ?? 1;
  const shouldSwitch = currentQuarter >= 3;
  const computedLeft = shouldSwitch ? homeTeam : awayTeam;
  const computedRight = shouldSwitch ? awayTeam : homeTeam;
  const leftTeam = leftTeamOverride ?? computedLeft;
  const rightTeam = rightTeamOverride ?? computedRight;
  const leftAbbr = leftTeam?.team?.abbreviation?.toUpperCase() || leftTeam?.abbreviation?.toUpperCase() || leftTeam?.shortDisplayName?.toUpperCase();
  const rightAbbr = rightTeam?.team?.abbreviation?.toUpperCase() || rightTeam?.abbreviation?.toUpperCase() || rightTeam?.shortDisplayName?.toUpperCase();

  const convertToFieldYard = (abbr?: string, yard?: number) => {
    if (yard === undefined || yard < 0 || yard > 100) return undefined;
    if (yard === 0 || yard === 100) return yard; // end zones stay at their absolute edges
    if (!abbr) return yard; // unknown team, assume left-to-right as-is
    if (abbrMatches(abbr, leftAbbr)) return yard; // left team keeps yard as-is
    if (abbrMatches(abbr, rightAbbr)) return 100 - yard; // flip for right team
    // Unrecognized team token: leave as-is to avoid stalling the animation
    return yard;
  };
  
  // Get visualization config for this play type - handle both string and object
  const extractPlayType = (play?: any) => {
    if (!play) return '';
    if (play.type) {
      if (typeof play.type === 'string') return play.type;
      if (typeof play.type === 'object') {
        const fromFields = play.type.text || play.type.displayName || play.type.abbreviation;
        if (fromFields) return fromFields;
        const typeId = typeof play.type.id === 'string' ? play.type.id : undefined;
        const typeIdMap: Record<string, string> = {
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
          '17': 'Two-minute warning',
          '18': 'End Period',
          '19': 'End of Half',
          '20': 'End of Game',
          '24': 'Rush',
          '25': 'Pass',
          '26': 'Run',
          '53': 'Kickoff'
        };
        if (typeId && typeIdMap[typeId]) return typeIdMap[typeId];
        if (typeId) return typeId;
      }
    }
    const text = play.text || '';
    const textLower = text.toLowerCase();

    // Fallback: infer from text when ESPN play type is missing (e.g., penalties flagged as "No Play")
    if (textLower.includes('penalty')) return 'Penalty';
    if (textLower.includes('pass')) return 'Pass';
    if (textLower.includes('rush') || textLower.includes('run')) return 'Rush';
    if (textLower.includes('field goal')) return 'Field Goal';
    if (textLower.includes('kickoff')) return 'Kickoff';
    if (textLower.includes('punt')) return 'Punt';
    if (textLower.includes('two-minute warning') || textLower.includes('two minute warning')) return 'Two Minute Warning';
    if (textLower.includes('timeout')) return 'Timeout';
    return text;
  };

  // Prefer explicit type text from the latest play log when situation.lastPlay is sparse
  const resolvedPlayType = extractPlayType(lastPlay) || extractPlayType(playLog?.[0]) || lastPlay.text || playLog?.[0]?.text || '';

  const playViz = getPlayVisualization(resolvedPlayType);

  // If we still cannot derive a meaningful play type, skip rendering to avoid empty field
  if (!playViz) return null;

  const normalizeName = (v?: string) => v?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';

  // Choose the QB involved in the sack from play data, favoring explicit position tagging
  const qbCandidate = React.useMemo(() => {
    const athletes = lastPlay.athletesInvolved || [];
    const byPosition = athletes.find(a => a.position?.toUpperCase?.() === 'QB');
    if (byPosition) return byPosition;

    const qbNameRegex = /([A-Z]\.[A-Za-z'\-]+)/i;
    const qbNameCompact = normalizeName(lastPlay.text?.match(qbNameRegex)?.[1]);
    if (qbNameCompact) {
      const byShort = athletes.find(a => normalizeName(a.shortName) === qbNameCompact);
      if (byShort) return byShort;
      const byDisplay = athletes.find(a => normalizeName(a.displayName).includes(qbNameCompact));
      if (byDisplay) return byDisplay;
    }

    return athletes[1] || athletes[0];
  }, [lastPlay.athletesInvolved, lastPlay.text]);

  // Prefer athletes from lastPlay, but fall back to latest playLog entry when situation.lastPlay lacks participants
  const resolvedAthletes = React.useMemo(() => {
    if (lastPlay?.athletesInvolved?.length) return lastPlay.athletesInvolved;
    if (playLog?.[0]?.athletesInvolved?.length) return playLog[0].athletesInvolved;
    return [] as any[];
  }, [lastPlay?.athletesInvolved, playLog]);

  const primaryAthlete = resolvedAthletes[0] || qbCandidate;
  const primaryHeadshot = getHeadshotUrl({ id: primaryAthlete?.id, headshot: primaryAthlete?.headshot });
  const hasPrimaryAthlete = Boolean(primaryAthlete);

  // For pass plays, separate QB and receiver using type field from play data
  const qbAthlete = React.useMemo(() => {
    const athletes = resolvedAthletes || [];
    // Try to find by type field first (most reliable)
    const byType = athletes.find(a => (a as any).type === 'passer' || (a as any).type === 'QB');
    if (byType) return byType;
    // Try to find QB by position
    const byPosition = athletes.find(a => a.position?.toUpperCase?.() === 'QB');
    if (byPosition) return byPosition;
    // Fall back to first athlete (usually QB on pass plays)
    return athletes[0] || qbCandidate;
  }, [resolvedAthletes, qbCandidate]);

  const receiverAthlete = React.useMemo(() => {
    const athletes = resolvedAthletes || [];
    // Try to find by type field first (most reliable)
    const byType = athletes.find(a => (a as any).type === 'receiver' || (a as any).type === 'target');
    if (byType) return byType;
    // Receiver is typically the second athlete in pass plays
    if (athletes.length >= 2) {
      // Make sure it's not the QB
      const secondAthlete = athletes[1];
      if (secondAthlete?.position?.toUpperCase?.() !== 'QB' && (secondAthlete as any).type !== 'passer') {
        return secondAthlete;
      }
    }
    // Fall back to any non-QB athlete
    return athletes.find(a => a.position?.toUpperCase?.() !== 'QB' && a.id !== qbAthlete?.id && (a as any).type !== 'passer');
  }, [resolvedAthletes, qbAthlete]);

  const qbHeadshotUrl = getHeadshotUrl({ id: qbAthlete?.id, headshot: qbAthlete?.headshot });
  const receiverHeadshotUrl = getHeadshotUrl({ id: receiverAthlete?.id, headshot: receiverAthlete?.headshot });
  const hasReceiver = Boolean(receiverAthlete);

  // Possession-based normalization: orientation depends on which side home is on
  const possessionIsHome = situation?.possession === homeTeam?.id;
  const homeOnLeft = leftTeam?.id === homeTeam?.id;
  const possessionAbbr = possessionIsHome ? homeAbbrRaw : awayAbbrRaw;
  const teamColor = possessionIsHome ? '#FAAFE8' : '#00FFE7'; // pink for home, cyan for away
  // Helper: derive headshot color by athlete team id (fallback to possession color)
  const getTeamColorForTeamId = React.useCallback(
    (teamId?: string) => {
      if (!teamId) return teamColor;
      if (teamId === homeTeam?.id) return '#FAAFE8';
      if (teamId === awayTeam?.id) return '#00FFE7';
      return teamColor;
    },
    [awayTeam?.id, homeTeam?.id, teamColor]
  );

  // For kickoffs/punts, extract accurate yard lines from text since start/end data is unreliable
  let kickStartYard: number | null = null;
  let kickEndYard: number | null = null;
  let returnStartYard: number | null = null; // Where returner catches/recovers
  let returnEndYard: number | null = null; // Final position after return
  const isKickPlay = playViz.animate === 'punt' || playViz.animate === 'kickoff' || playViz.animate === 'kickoff-fail';
  
  if (debugLogs) console.log('🏈 Is kick play?', isKickPlay, 'playViz.animate:', playViz.animate);

  if (isKickPlay && lastPlay?.text) {
    // Extract punts (optionally include the from yard), plus returns
    const puntMatch = lastPlay.text.match(/punts\s+(\d+)\s+yards(?:\s+from\s+(\w+)\s+(\d+))?\s+to\s+(\w+)\s+(\d+)/i);
    const puntToEndZoneMatch = lastPlay.text.match(/punts\s+\d+\s+yards(?:\s+from\s+(\w+)\s+(\d+))?\s+to\s+(?:the\s+)?end zone/i);
    // Extract "kicks XX yards from TEAM YY to TEAM ZZ" for kick trajectory
    const kickMatch = lastPlay.text.match(/kicks\s+\d+\s+yards\s+from\s+(\w+)\s+(\d+)\s+to\s+(\w+)\s+(\d+)/i);
    const toEndZoneMatch = lastPlay.text.match(/kicks\s+\d+\s+yards\s+from\s+(\w+)\s+(\d+)\s+to\s+(?:the\s+)?end zone/i);
    
    // Extract "recovers at TEAM YY" for muffed kicks
    const recoveryMatch = lastPlay.text.match(/recovers at\s+(\w+)\s+(\d+)/i);
    
    // Extract "to TEAM YY for ZZ yards" for return
    const returnMatch = lastPlay.text.match(/to\s+(\w+)\s+(\d+)\s+for\s+\d+\s+yards/i);
    
    if (puntMatch) {
      const puntDistance = parseInt(puntMatch[1]);
      const fromTeamAbbr = puntMatch[2]?.toUpperCase();
      const fromYardLine = puntMatch[3] ? parseInt(puntMatch[3]) : undefined;
      const landTeamAbbr = puntMatch[4].toUpperCase();
      const landYardLine = parseInt(puntMatch[5]);

      if (fromTeamAbbr && typeof fromYardLine === 'number' && !Number.isNaN(fromYardLine)) {
        const isPuntTeamLeft = abbrMatches(fromTeamAbbr, leftAbbr);
        kickStartYard = isPuntTeamLeft ? fromYardLine : (100 - fromYardLine);
      } else {
        const rawStart = getStartYard(lastPlay);
        if (typeof rawStart === 'number') kickStartYard = rawStart;
      }

      const isLandTeamLeft = abbrMatches(landTeamAbbr, leftAbbr);
      kickEndYard = isLandTeamLeft ? landYardLine : (100 - landYardLine);
      returnStartYard = kickEndYard;

      // If no explicit from yard, infer a reasonable snap spot using distance when possible
      if (kickStartYard === null && !Number.isNaN(puntDistance) && puntDistance > 0 && kickEndYard !== null) {
        const inferredStart = kickEndYard - puntDistance;
        kickStartYard = inferredStart;
      }
    } else if (puntToEndZoneMatch) {
      const fromTeamAbbr = puntToEndZoneMatch[1]?.toUpperCase();
      const fromYardLine = puntToEndZoneMatch[2] ? parseInt(puntToEndZoneMatch[2]) : undefined;
      if (fromTeamAbbr && typeof fromYardLine === 'number' && !Number.isNaN(fromYardLine)) {
        const isPuntTeamLeft = abbrMatches(fromTeamAbbr, leftAbbr);
        kickStartYard = isPuntTeamLeft ? fromYardLine : (100 - fromYardLine);
      }
      const isPuntTeamLeft = fromTeamAbbr ? abbrMatches(fromTeamAbbr, leftAbbr) : false;
      // Punt touchbacks go to receiving team's 20
      kickEndYard = isPuntTeamLeft ? 80 : 20;
      returnStartYard = kickEndYard;
      returnEndYard = kickEndYard;
    } else if (kickMatch) {
      const kickTeamAbbr = kickMatch[1].toUpperCase();
      const kickYardLine = parseInt(kickMatch[2]);
      const landTeamAbbr = kickMatch[3].toUpperCase();
      const landYardLine = parseInt(kickMatch[4]);
      
      // Convert kick start position
      const isKickTeamLeft = abbrMatches(kickTeamAbbr, leftAbbr);
      kickStartYard = isKickTeamLeft ? kickYardLine : (100 - kickYardLine);
      
      // Convert landing position (where ball first lands)
      const isLandTeamLeft = abbrMatches(landTeamAbbr, leftAbbr);
      kickEndYard = isLandTeamLeft ? landYardLine : (100 - landYardLine);
      
      // Default return start is where ball lands
      returnStartYard = kickEndYard;
    } else if (toEndZoneMatch) {
      // Touchback case
      const kickTeamAbbr = toEndZoneMatch[1].toUpperCase();
      const kickYardLine = parseInt(toEndZoneMatch[2]);
      
      const isKickTeamLeft = abbrMatches(kickTeamAbbr, leftAbbr);
      kickStartYard = isKickTeamLeft ? kickYardLine : (100 - kickYardLine);
      
      // Touchback goes to receiving team's 25
      kickEndYard = isKickTeamLeft ? 75 : 25;
      returnStartYard = kickEndYard;
      returnEndYard = kickEndYard; // No return on touchback
    }
    
    // Check for recovery position (muffed kick)
    if (recoveryMatch) {
      const recoveryTeamAbbr = recoveryMatch[1].toUpperCase();
      const recoveryYardLine = parseInt(recoveryMatch[2]);
      
      const isRecoveryTeamLeft = abbrMatches(recoveryTeamAbbr, leftAbbr);
      returnStartYard = isRecoveryTeamLeft ? recoveryYardLine : (100 - recoveryYardLine);
    }
    
    // Get return end position if there's a return
    if (returnMatch) {
      const returnTeamAbbr = returnMatch[1].toUpperCase();
      const returnYardLine = parseInt(returnMatch[2]);
      
      const isReturnTeamLeft = abbrMatches(returnTeamAbbr, leftAbbr);
      returnEndYard = isReturnTeamLeft ? returnYardLine : (100 - returnYardLine);
    } else {
      // No return, final position is where ball was caught/recovered
      returnEndYard = returnStartYard;
    }
    
  }

  // Distance-aware timing helpers so kick/return animations scale with travel distance
  const distancePxFromYards = (
    start: number | null | undefined,
    end: number | null | undefined,
    fallbackPx = 0,
    depthPercent = headshotTopPercent
  ) => {
    if (start === null || end === null || start === undefined || end === undefined) return fallbackPx;
    const startX = projectYardX(start, depthPercent);
    const endX = projectYardX(end, depthPercent);
    const distancePercent = endX - startX;
    const distancePx = (distancePercent / 100) * fieldWidthPx;
    const absPx = Math.abs(distancePx);
    return absPx > 0 ? absPx : fallbackPx;
  };

  const durationFromDistance = (distancePx: number, perPixelMs: number, minMs: number, maxMs: number, fallbackMs: number) => {
    const raw = distancePx * perPixelMs;
    if (!raw || Number.isNaN(raw)) return fallbackMs;
    return Math.min(Math.max(raw, minMs), maxMs);
  };

  const kickArcDistancePx = distancePxFromYards(kickStartYard, kickEndYard, fieldWidthPx * 0.05); // 5% width fallback
  const returnDistancePxForTiming = distancePxFromYards(returnStartYard, returnEndYard, 24); // tiny nudge fallback matches return slide

  const kickArcDurationMs = isKickPlay
    ? durationFromDistance(kickArcDistancePx, 5, 1400, 5200, 5000)
    : 0;
  const returnSlideDurationMs = isKickPlay
    ? durationFromDistance(returnDistancePxForTiming, 4, 900, 3600, RUSH_ANIMATION_MS)
    : 0;

  // Gate the return animation until the kick arc finishes
  const playKey = getPlayId(lastPlay) || lastPlay?.text || (lastPlay as any)?.type?.id || getPlayTypeText(lastPlay) || '';

  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (isKickPlay) {
      setKickPhaseComplete(false);
      setKickDone(false);
      setReturnStarted(false);
      setBallFade(false);
      timer = setTimeout(() => {
        setKickPhaseComplete(true);
        setKickDone(true);
        setReturnStarted(true);
        setBallFade(true);
      }, kickArcDurationMs || 5000);
    } else {
      setKickPhaseComplete(true);
      setKickDone(false);
      setReturnStarted(true);
      setBallFade(true);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [kickArcDurationMs, playKey, isKickPlay, loopCycle]);
  
  const possessionDirection = possessionIsHome
    ? (homeOnLeft ? 1 : -1)
    : (homeOnLeft ? -1 : 1);
  const fallbackYard = situation?.yardLine;
  const normalizedStartYard = isKickPlay
    ? undefined
    : convertToFieldYard(possessionAbbr, getStartYard(lastPlay) ?? fallbackYard);
  const normalizedEndYard = isKickPlay
    ? undefined
    : convertToFieldYard(possessionAbbr, getEndYard(lastPlay) ?? fallbackYard);

  // Use kick yards if available, otherwise use normalized-by-possession yard data
  let playStartYard = isKickPlay && kickStartYard !== null
    ? kickStartYard
    : (normalizedStartYard ?? getStartYard(lastPlay) ?? fallbackYard);
  let playEndYard = isKickPlay && returnEndYard !== null
    ? returnEndYard
    : (normalizedEndYard ?? getEndYard(lastPlay) ?? fallbackYard);


  // Force scoring plays to end at the correct goal line so touchdowns/FGs reach the posts, and backfill a reasonable start if distance is known
  const isTouchdownPlay = ((getPlayTypeText(lastPlay) || '').toLowerCase().includes('touchdown')) || ((lastPlay?.text || '').toLowerCase().includes('touchdown'));
  const distanceMatch = lastPlay.text?.match(/for\s+(\d+)\s+yards/i);
  const distanceYards = distanceMatch ? parseInt(distanceMatch[1], 10) : undefined;
  const statYardage = typeof (lastPlay as any)?.statYardage === 'number' ? (lastPlay as any).statYardage : undefined;

  // Field goal attempts should always target the opponent posts; use statYardage to infer snap spot when available
  if (playViz.animate === 'field-goal') {
    const goalCenter = possessionIsHome ? -5 : 105; // inside the opponent end zone
    playEndYard = goalCenter;

    const fgDistance = statYardage ?? distanceYards;
    if (fgDistance && !Number.isNaN(fgDistance)) {
      const inferredStart = clampYard(goalCenter - possessionDirection * fgDistance);
      playStartYard = inferredStart;
    }
  }

  // If end yard is missing but we have start+gain or we can parse a target yard from text, infer it for animation
  let inferredEndYard: number | undefined;
  if (!isKickPlay && playStartYard !== undefined && (playEndYard === undefined || playEndYard === playStartYard)) {
    // Try to parse explicit yard from play text (e.g., "to BLT 15")
    if (lastPlay?.text) {
      const yardTextMatch = lastPlay.text.match(/\b(?:to|at)\s+([A-Z]{2,3})\s+(\d{1,2})\b/i);
      if (yardTextMatch) {
        const abbr = yardTextMatch[1].toUpperCase();
        const yardNum = parseInt(yardTextMatch[2], 10);
        const parsedYard = convertToFieldYard(abbr, yardNum);
        if (typeof parsedYard === 'number') {
          inferredEndYard = parsedYard;
        }
      }
    }

    // If still missing, use yardage gain/loss when available
    const distanceFromGain = distanceYards ?? (typeof lastPlay?.yardage === 'number' ? lastPlay.yardage : undefined);
    if (inferredEndYard === undefined && distanceFromGain !== undefined && !Number.isNaN(distanceFromGain)) {
      inferredEndYard = clampYard(playStartYard + possessionDirection * distanceFromGain);
    }

    if (inferredEndYard !== undefined) {
      playEndYard = inferredEndYard;
    }
  }
  if (!isKickPlay && isTouchdownPlay) {
    const goalCenter = possessionIsHome ? -5 : 105; // middle of end zone (inside)
    playEndYard = goalCenter;
    if (distanceYards && distanceYards > 0) {
      const inferredStart = clampYard(goalCenter - possessionDirection * distanceYards);
      const currentSpan = (playStartYard !== undefined && playEndYard !== undefined)
        ? Math.abs(playEndYard - playStartYard)
        : 0;
      // If start is missing or clearly inconsistent with the stated gain, use inferred start
      if (playStartYard === undefined || currentSpan < distanceYards - 3 || currentSpan > distanceYards + 10) {
        playStartYard = inferredStart;
      }
    }
  }

  // Normalize pass direction to possession so incompletions can target a reasonable depth
  const observedPassDirection = playStartYard !== undefined && playEndYard !== undefined && playEndYard !== playStartYard
    ? Math.sign(playEndYard - playStartYard)
    : 0;
  const passDirection = observedPassDirection !== 0 ? observedPassDirection : possessionDirection;
  let normalizedPassStart = playStartYard;
  let normalizedPassEnd = playEndYard;
  let estimatedIncompleteTarget = false;

  if (playViz.animate === 'pass-incomplete' && lastPlay.text && normalizedPassStart !== undefined) {
    const depthDirMatch = lastPlay.text.match(/(short|deep)\s+(left|middle|right)/i);
    if (depthDirMatch) {
      const depthBucket = depthDirMatch[1].toLowerCase();
      const depthYards = depthBucket === 'short' ? 8 : 18;
      normalizedPassEnd = clampYard(normalizedPassStart + passDirection * depthYards);
      estimatedIncompleteTarget = true;
      console.log('🎯 Estimated incomplete target', { depthBucket, normalizedPassStart, normalizedPassEnd, passDirection, text: lastPlay.text });
    }
  }

  // Drive a per-play loop length so animations restart only after their real duration plus a short buffer
  const playDurationMs = React.useMemo(() => {
    const distancePercent = (playStartYard !== undefined && playEndYard !== undefined)
      ? headshotX(playEndYard) - headshotX(playStartYard)
      : 0;
    const signedDistancePx = (distancePercent / 100) * fieldWidthPx;
    const distancePx = Math.abs(signedDistancePx);
    const passDurationMs = Math.min(Math.max(distancePx * 5, 900), 4800);

    if (playViz.animate === 'pass-complete' || playViz.animate === 'pass-incomplete') {
      return passDurationMs + PASS_PAUSE_MS + PLAY_END_DELAY_MS;
    }

    if (isKickPlay) {
      const hasReturnPhase = playViz.animate !== 'kickoff-fail' && hasPrimaryAthlete;
      const returnDuration = hasReturnPhase ? (returnSlideDurationMs || RUSH_ANIMATION_MS) : 0;
      const arcDuration = kickArcDurationMs || 5000;
      return arcDuration + returnDuration + PLAY_END_DELAY_MS;
    }

    if (playViz.animate === 'rush') return RUSH_ANIMATION_MS + PLAY_END_DELAY_MS;
    if (playViz.animate === 'sack') return 1600 + PLAY_END_DELAY_MS;
    if (playViz.animate === 'field-goal') return 5500 + PLAY_END_DELAY_MS;
    if (playViz.animate === 'penalty') return 2400 + PLAY_END_DELAY_MS;
    if (playViz.animate === 'timeout') return 3000 + PLAY_END_DELAY_MS;
    if (playViz.animate === 'two-minute-warning') return 2000 + PLAY_END_DELAY_MS;
    if (playViz.animate === 'end-regulation') return 3600 + PLAY_END_DELAY_MS;
    if (playViz.animate === 'pulse') return 2400 + PLAY_END_DELAY_MS;
    return 3200 + PLAY_END_DELAY_MS;
  }, [fieldWidthPx, hasPrimaryAthlete, isKickPlay, playEndYard, playStartYard, playViz.animate, PASS_PAUSE_MS, PLAY_END_DELAY_MS, RUSH_ANIMATION_MS, kickArcDurationMs, returnSlideDurationMs]);

  React.useEffect(() => {
    setLoopCycle(0);
  }, [playKey]);

  React.useEffect(() => {
    const timer = setTimeout(() => setLoopCycle((c) => c + 1), playDurationMs);
    return () => clearTimeout(timer);
  }, [playDurationMs, playKey, loopCycle]);

          const losTopX = projectYardX(playStartYard, 0);
          const losBottomX = projectYardX(playStartYard, 100);

  return (
    <div className="space-y-2">
      {/* Current Drive Info - Only show if showGameInfo is true */}
      {showGameInfo && situation && ('downDistanceText' in situation) && (
        <div className="flex items-center justify-between gap-4 mb-4">
          {/* Down & Distance */}
          {(situation as any).downDistanceText && (
            <div className="flex-1 text-center">
              <p className="text-text-muted text-xs mb-2">Down & Distance</p>
              <p className="text-neon-pink font-bold text-xl">{(situation as any).downDistanceText}</p>
            </div>
          )}
          
          {/* Possession */}
          <div className="flex-1 text-center">
            <p className="text-text-muted text-xs mb-2">Possession</p>
            <div className="flex items-center justify-center gap-2">
              <img
                src={situation.possession === homeTeam?.id ? getTeamLogo(homeTeam?.team) : getTeamLogo(awayTeam?.team)}
                alt="Possession"
                className="w-10 h-10"
              />
              <p className="text-neon-cyan font-bold text-xl">
                {situation.possession === homeTeam?.id ? homeTeam?.team.abbreviation : awayTeam?.team.abbreviation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Football Field */}
      <div className={showGameInfo ? "border-t border-neon-cyan/10 pt-6" : ""}>
    <div
      ref={fieldRef}
      className="relative w-full overflow-visible shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
      style={{
        height: '140px'
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, #0f3d15 0%, #0f5320 55%, #0a2d10 100%)',
          clipPath: `polygon(${TRAPEZOID_TOP_INSET}% 0%, ${100 - TRAPEZOID_TOP_INSET}% 0%, 100% 100%, 0 100%)`,
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '0',
          overflow: 'hidden'
        }}
      >
        <svg className="absolute inset-0 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Subtle shine */}
          <linearGradient id="field-gloss" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.06)" />
            <stop offset="35%" stopColor="rgba(255,255,255,0.0)" />
          </linearGradient>
          <rect x="0" y="0" width="100" height="100" fill="url(#field-gloss)" />
          {/* End zones anchored to trapezoid corners with bottom inset */}
          <polygon
            points={`${TRAPEZOID_TOP_INSET},0 ${projectYardX(10, 0)},0 ${projectYardX(10, 100)},100 ${trapezoidBottomInset},100`}
            fill="rgba(59, 130, 246, 0.20)"
          />
          <polygon
            points={`${100 - TRAPEZOID_TOP_INSET},0 ${projectYardX(90, 0)},0 ${projectYardX(90, 100)},100 ${100 - trapezoidBottomInset},100`}
            fill="rgba(239, 68, 68, 0.20)"
          />

          {/* Yard lines with taper, projected to match angled edges */}
          {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((fieldPercent) => {
            const xTop = projectYardX(fieldPercent, 0);
            const xBottom = projectYardX(fieldPercent, 100);
            const yardNumber = fieldPercent <= 50 ? fieldPercent : 100 - fieldPercent;
            const isFifty = fieldPercent === 50;
            return (
              <React.Fragment key={`line-${fieldPercent}`}>
                <line
                  x1={`${xTop}%`}
                  y1="0%"
                  x2={`${xBottom}%`}
                  y2="100%"
                  stroke={isFifty ? 'rgba(255, 226, 143, 0.55)' : 'rgba(255,255,255,0.18)'}
                  strokeWidth={isFifty ? 0.8 : 0.45}
                />
                {fieldPercent % 10 === 0 && (
                  <text
                    x={`${xBottom}%`}
                    y={`${numberTopPercent}`}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.50)"
                    fontSize="3.6"
                    fontWeight="700"
                    style={{ paintOrder: 'stroke', stroke: 'rgba(0,0,0,0.35)', strokeWidth: 0.5 }}
                  >
                    {yardNumber}
                  </text>
                )}
              </React.Fragment>
            );
          })}
        </svg>

        {/* End zone logos anchored to trapezoid projection */}
        <div
          className="absolute z-10"
          style={{
            left: `11%`,
            top: '55%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <img src={getTeamLogo(leftTeam?.team)} alt="" className="w-8 h-8 opacity-75" />
        </div>
        <div
          className="absolute z-10"
          style={{
            left: `89%`,
            top: '55%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <img src={getTeamLogo(rightTeam?.team)} alt="" className="w-8 h-8 opacity-75" />
        </div>
      </div>

      <div className="absolute inset-0 z-[40]">

      {/* Line of scrimmage - projected like yard lines and clipped to the field bounds */}
      {playStartYard !== undefined && (() => {
        // Parse down information from situation.downDistanceText (e.g., "1st & 10", "4th & 2")
        const downDistanceText = situation?.downDistanceText || '';
        const downMatch = downDistanceText.match(/(\d+)(st|nd|rd|th)/);
        const down = downMatch ? parseInt(downMatch[1]) : undefined;
        const distanceMatch = downDistanceText.match(/&\s*(\d+)/);
        const yardsToGo = distanceMatch ? parseInt(distanceMatch[1]) : undefined;
        
        // Calculate first down line position
        const firstDownYard = yardsToGo !== undefined && playStartYard !== undefined
          ? clampYard(playStartYard + possessionDirection * yardsToGo)
          : undefined;
        
        // Determine colors based on down
        const is4thDown = down === 4;
        const losColor = 'rgba(30, 144, 255, 0.95)'; // Blue for line of scrimmage
        const firstDownColor = is4thDown ? 'rgba(255, 50, 50, 0.95)' : 'rgba(255, 200, 0, 0.95)'; // Red for 4th, yellow for others
        
        return (
          <div
            className="absolute inset-0 pointer-events-none z-[5]"
            style={{
              clipPath: `polygon(${TRAPEZOID_TOP_INSET}% 0%, ${100 - TRAPEZOID_TOP_INSET}% 0%, ${100 - trapezoidBottomInset}% 100%, ${trapezoidBottomInset}% 100%)`
            }}
          >
            <svg className="absolute inset-0" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Line of scrimmage - blue line */}
              <line
                x1={`${projectYardX(playStartYard, 0)}%`}
                y1="0%"
                x2={`${projectYardX(playStartYard, 100)}%`}
                y2="100%"
                stroke={losColor}
                strokeWidth="0.5"
                strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 6px ${losColor})` }}
              />
              
              {/* First down line - yellow for 1st-3rd down, red for 4th down */}
              {firstDownYard !== undefined && yardsToGo !== undefined && (
                <line
                  x1={`${projectYardX(firstDownYard, 0)}%`}
                  y1="0%"
                  x2={`${projectYardX(firstDownYard, 100)}%`}
                  y2="100%"
                  stroke={firstDownColor}
                  strokeWidth="0.5"
                  strokeLinecap="round"
                  style={{ filter: `drop-shadow(0 0 6px ${firstDownColor})` }}
                />
              )}
            </svg>
          </div>
        );
      })()}

      {/* Start position dot - positioned at arrow/football level */}
      {playStartYard !== undefined && playViz.animate !== 'timeout' && playViz.animate !== 'two-minute-warning' && playViz.animate !== 'end-regulation' && (
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2"
          style={{ 
            left: `${arrowX(playStartYard)}%`,
            top: `${arrowTopPercent}%`
          }}
        >
          <div 
            className="w-3 h-3 rounded-full border-2 border-white shadow-lg"
            style={{ 
              backgroundColor: playViz.color,
              boxShadow: `0 0 10px ${playViz.glowColor}`
            }}
          />
        </div>
      )}

      {/* Arrow showing play direction - arrowhead only */}
      {playStartYard !== undefined && playEndYard !== undefined && playStartYard !== playEndYard && (
        <div className="absolute left-0 top-0 w-full h-full pointer-events-none">
          {/* Arc path for punts/kickoffs */}
          {playViz.animate === 'arc' && (
            <svg
              className="absolute left-0 top-0 w-full h-full"
            >
              <path
                d={`M ${arrowX(playStartYard)}%,${arrowTopPercent}% Q ${arrowX(((playStartYard ?? 0) + (playEndYard ?? 0)) / 2)}%,13% ${arrowX(playEndYard)}%,${arrowTopPercent}%`}
                stroke={playViz.color}
                strokeWidth={playViz.width}
                fill="none"
                opacity="0.5"
                strokeDasharray="4,2"
              />
            </svg>
          )}

          {/* Direction arrow: shaft plus arrowhead that reaches the end yard */}
          {(() => {
            const startX = arrowX(playStartYard);
            const endX = arrowX(playEndYard);
            const distance = endX - startX;
            const width = Math.abs(distance);
            const left = distance >= 0 ? startX : endX;
            const pointingRight = distance >= 0;
            return (
              <div
                className="absolute"
                style={{
                  left: `${left}%`,
                  top: `${arrowTopPercent}%`,
                  width: `${width}%`,
                  transform: 'translateY(-50%)'
                }}
              >
                <div
                  className="absolute top-1/2"
                  style={{
                    left: 0,
                    right: 0,
                    height: '2px',
                    transform: 'translateY(-50%)',
                    background: `linear-gradient(90deg, ${playViz.glowColor}, ${playViz.color})`,
                    boxShadow: `0 0 8px ${playViz.glowColor}`
                  }}
                />
                <div
                  className="absolute"
                  style={{
                    right: pointingRight ? '-2px' : 'auto',
                    left: pointingRight ? 'auto' : '-2px',
                    top: '50%',
                    transform: `translate(0, -50%) rotate(${pointingRight ? 0 : 180}deg)`
                  }}
                >
                  <div
                    style={{
                      width: 0,
                      height: 0,
                      borderTop: '9px solid transparent',
                      borderBottom: '9px solid transparent',
                      borderLeft: `28px solid ${playViz.color}`,
                      filter: `drop-shadow(0 0 10px ${playViz.glowColor})`
                    }}
                  />
                </div>
              </div>
            );
          })()}

          {/* Play type icon at midpoint - only show for fail cases */}
          {playViz.icon === '🚫' && (
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 text-2xl z-20"
              style={{
                left: `${arrowX(((playStartYard ?? 0) + (playEndYard ?? 0)) / 2)}%`,
                top: '50%',
                filter: `drop-shadow(0 0 8px ${playViz.glowColor})`
              }}
            >
              {playViz.icon}
            </div>
          )}
        </div>
      )}

      {/* Timeout - spinning clock emoji (doesn't need play positions) */}
      {playViz.animate === 'timeout' && (
        <div
          className="absolute z-20"
          style={{ 
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div 
            className="text-5xl animate-timeout-spin"
            style={{
              filter: `drop-shadow(0 0 20px ${playViz.glowColor})`
            }}
          >
            {playViz.icon}
          </div>
        </div>
      )}

      {/* Two Minute Warning - pulsing alarm at center (doesn't need play positions) */}
      {playViz.animate === 'two-minute-warning' && (
        <div
          className="absolute z-20"
          style={{ 
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div 
            className="flex flex-col items-center gap-2 animate-two-minute-warning"
            style={{
              filter: `drop-shadow(0 0 30px ${playViz.glowColor})`
            }}
          >
            <div className="text-6xl">{playViz.icon}</div>
            <div 
              className="text-xl font-bold whitespace-nowrap"
              style={{ color: playViz.color }}
            >
              2:00
            </div>
          </div>
        </div>
      )}

      {/* Pulse animations (touchdowns) - pulsing at center */}
      {playViz.animate === 'pulse' && (
        <div
          className="absolute z-20"
          style={{ 
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div 
            className="text-5xl animate-pulse"
            style={{
              filter: `drop-shadow(0 0 30px ${playViz.glowColor})`
            }}
          >
            {playViz.icon}
          </div>
        </div>
      )}

      {/* End of quarter/half/regulation - show ad-style banner at center */}
      {playViz.animate === 'end-regulation' && (
        <div
          className="absolute z-20 w-3/4 max-w-xl"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div
            className="relative overflow-hidden rounded-xl shadow-2xl border-2"
            style={{
              background: 'linear-gradient(135deg, rgba(0,255,231,0.15), rgba(250,175,232,0.15))',
              borderColor: `${playViz.color}70`,
              boxShadow: `0 0 30px ${playViz.glowColor}`
            }}
          >
            <div className="absolute inset-0 opacity-30 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.08)_8px,transparent_8px,transparent_16px)]" />
            <div className="px-6 py-4 flex items-center justify-between gap-4">
              <span className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">Presented by</span>
              <span className="text-2xl font-extrabold" style={{ color: playViz.color }}>
                {lastPlay?.text || 'End of quarter'}
              </span>
              <span className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">Touchdown Live</span>
            </div>
          </div>
        </div>
      )}

      {/* Animated play elements */}
      {(getStartYard(lastPlay) !== undefined) && (getEndYard(lastPlay) !== undefined) && (lastPlay as any)?.athletesInvolved && (lastPlay as any)?.athletesInvolved.length > 0 && (() => {
        if (debugLogs) console.log('Play data:', lastPlay);
        const resolvedStartYard = normalizedPassStart ?? playStartYard ?? getStartYard(lastPlay);
        const resolvedEndYard = normalizedPassEnd ?? playEndYard ?? getEndYard(lastPlay);
        if (resolvedStartYard === undefined || resolvedEndYard === undefined) return null;

        const passStartYard = resolvedStartYard;
        const passEndYard = resolvedEndYard;
        // Clamp end yard to visible field bounds for display (0-100) to prevent animations going off screen
        const displayEndYard = Math.max(0, Math.min(100, resolvedEndYard));
        // Use proper trapezoid projection for consistent positioning
        const baseStartX = headshotX(resolvedStartYard);
        const baseEndX = headshotX(displayEndYard);
        // Use raw start/end yard lines to keep arrow and animation aligned
        const passStartX = headshotX(passStartYard);
        const passEndX = headshotX(passEndYard);
        const distance = passEndX - passStartX;
        const signedDistancePx = distance / 100 * fieldWidthPx;
        const distancePx = Math.abs(signedDistancePx);
        const passDurationMs = Math.min(Math.max(distancePx * 5, 900), 4800); // clamp for fluid speed
        
        // Rush animation - headshot slides from dot with football (supports losses/backwards motion)
        if (playViz.animate === 'rush') {
          // Calculate distance as percentage of field width (signed)
          const distancePercent = baseEndX - baseStartX;
          const fieldWidth = fieldRef.current?.offsetWidth || 1000;
          // Keep signed distance and add a small offset in the same direction so the ball clears the start dot
          const distancePixels = (distancePercent / 100) * fieldWidth;
          const distanceWithOffset = distancePixels + (Math.sign(distancePixels || 0) * 12);
          const hasMovement = Math.abs(distanceWithOffset) > 1;
          const hasGain = (playEndYard ?? getEndYard(lastPlay) ?? 0) > (playStartYard ?? getStartYard(lastPlay) ?? 0);
          // Determine rush direction for football positioning
          const rushDirection = Math.sign(distanceWithOffset);
          const footballOnRight = rushDirection >= 0; // rushing right = ball on right side
          
          console.log('Rush animation:', { startX: baseStartX, endX: baseEndX, distancePercent, fieldWidth, distanceWithOffset, hasGain, footballOnRight });
          
          return (
            <>
              {/* Headshot with football starts at dot */}
              <div
                key={`rush-${getStartYard(lastPlay)}-${getEndYard(lastPlay)}-${isTouchdownPlay ? 'static' : loopCycle}`}
                className="absolute z-10"
                style={{ 
                  left: `${baseStartX}%`,
                  top: `${headshotTopPercent}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div
                  className={hasMovement ? "animate-rush-slide" : ""}
                  style={{
                    '--distance': `${distanceWithOffset}px`
                  } as React.CSSProperties}
                >
                  <div className="relative group">
                    {/* Headshot */}
                    <div 
                      className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl"
                      style={{
                        backgroundColor: `${playViz.color}30`,
                        boxShadow: `0 0 20px ${playViz.glowColor}`
                      }}
                    >
                      {hasPrimaryAthlete && (
                        <img
                          src={primaryHeadshot || '/assets/football.png'}
                          alt={primaryAthlete?.displayName || 'Player'}
                          className="w-12 h-12 rounded-full object-cover z-1 border-2"
                          style={{ borderColor: teamColor }}
                        />
                      )}
                      {!hasPrimaryAthlete && (
                        <FaFootballBall className="text-2xl" style={{ color: playViz.color }} />
                      )}
                      {isTouchdownPlay && (
                        <img
                          src="/assets/football_dance.gif"
                          alt="Football Dance"
                          className="w-16 h-full object-contain absolute top-2/3 td-dance"
                          style={{ animationDuration: `${RUSH_ANIMATION_MS}ms` }}
                        />
                      )}
                    </div>
                    {/* Football being carried - show for any movement (gain or loss) */}
                    {hasMovement && (
                      <div 
                        className={`absolute top-1/2 transform -translate-y-1/3 -rotate-45 ${footballOnRight ? '-right-1' : '-left-1'}`}
                        style={{
                          filter: `drop-shadow(0 0 8px ${playViz.glowColor})`,
                          transform: footballOnRight ? 'translateY(-33%) rotate(-45deg)' : 'translateY(-33%) rotate(45deg) scaleX(-1)'
                        }}
                      >
                        <img
                          src="/assets/football.png"
                          alt="Football"
                          className="w-8 h-8 object-contain"
                        />
                      </div>
                    )}
                    {/* No movement emoji - animated overlay */}
                    {!hasMovement && (
                      <div 
                        className="absolute top-[30px] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-3xl animate-fadeInOut z-20"
                        style={{
                          filter: `drop-shadow(0 0 10px ${playViz.glowColor})`
                        }}
                      >
                        😰
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          );
        }
        
        // Pass animations - football spins from QB to receiver
        if (playViz.animate === 'pass-complete' || playViz.animate === 'pass-incomplete') {
          // Receiver starts near the line of scrimmage and runs to the catch point
          const receiverOffsetYards = 3; // yards ahead of QB at start
          const receiverStartYard = passStartYard + (Math.sign(distance) || 1) * receiverOffsetYards;
          const receiverStartX = headshotX(receiverStartYard);
          const receiverDistancePx = (passEndX - receiverStartX) / 100 * fieldWidthPx;

          // QB starts a few yards behind the line of scrimmage, then steps up to the snap spot (dot)
          const qbDropYards = 3;
          const qbSnapYard = clampYard(passStartYard - possessionDirection * qbDropYards);
          const qbSnapX = headshotX(qbSnapYard);
          const qbStepPx = (passStartX - qbSnapX) / 100 * fieldWidthPx;
          const qbHasMove = Math.abs(qbStepPx) > 0.5;
          const qbStepDurationMs = Math.min(Math.max(Math.abs(qbStepPx) * 5, 280), 900);
          
          return (
            <React.Fragment key={`pass-${playKey}-${isTouchdownPlay ? 'static' : loopCycle}`}>
              {/* Football animation */}
              <div
                className="absolute z-20"
                style={{ 
                  left: `${passStartX}%`,
                  top: `${headshotTopPercent}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div
                  style={{
                    '--distance': distance,
                    '--distance-px': `${signedDistancePx}px`,
                    '--arc-height': `${Math.abs(distance) * 2.5}px`,
                    animation: `${playViz.animate === 'pass-complete' ? 'pass-arc' : 'pass-incomplete'} ${passDurationMs + PASS_PAUSE_MS}ms cubic-bezier(0.1, 0.0, 0.4, 1) 0s 1 forwards`,
                    willChange: 'transform, opacity'
                  } as React.CSSProperties}
                >
                  <img
                    src="/assets/football_spin.gif"
                    alt="Football"
                    className="w-8 h-8 object-contain"
                    style={{
                      filter: `drop-shadow(0 0 10px ${playViz.glowColor})`
                    }}
                  />
                </div>
              </div>
              
              {/* QB starts behind LOS and steps up to the snap/dot position */}
              <div
                className="absolute z-10"
                style={{ 
                  left: `${qbSnapX}%`,
                  top: `${headshotTopPercent}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div
                  style={{
                    '--distance-px': `${qbStepPx}px`,
                    animation: qbHasMove ? `headshot-follow ${qbStepDurationMs}ms cubic-bezier(0.4, 0.0, 0.2, 1) 0s 1 forwards` : 'none',
                    willChange: qbHasMove ? 'transform, opacity' : 'auto'
                  } as React.CSSProperties}
                >
                  <div className="relative group">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl"
                    style={{
                      backgroundColor: `${playViz.color}30`,
                      boxShadow: `0 0 20px ${playViz.glowColor}`
                    }}
                  >
                    {qbAthlete && (
                      <img
                        src={qbHeadshotUrl || '/assets/football.png'}
                        alt={qbAthlete?.displayName || 'QB'}
                        className="w-12 h-12 rounded-full object-cover z-10 border-2"
                        style={{ borderColor: teamColor }}
                      />
                    )}
                    {!qbAthlete && (
                      <FaFootballBall className="text-2xl" style={{ color: playViz.color }} />
                    )}
                  </div>
                  </div>
                </div>
              </div>

              {/* Receiver runs to catch position */}
              {hasReceiver && (
                <div
                  className="absolute z-10"
                  style={{ 
                    left: `${receiverStartX}%`,
                    top: `${headshotTopPercent}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <div
                    style={{
                      '--distance': distance,
                      '--distance-px': `${receiverDistancePx}px`,
                      animation: `headshot-follow ${passDurationMs + PASS_PAUSE_MS}ms cubic-bezier(0.4, 0.0, 0.2, 1) 0s 1 forwards`,
                      willChange: 'transform, opacity'
                    } as React.CSSProperties}
                  >
                    <div className="relative group">
                      <div 
                        className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl"
                        style={{
                          backgroundColor: `${playViz.color}30`,
                          boxShadow: `0 0 20px ${playViz.glowColor}`
                        }}
                      >
                        <img
                          src={receiverHeadshotUrl || '/assets/football.png'}
                          alt={receiverAthlete?.displayName || 'Receiver'}
                          className="w-12 h-12 rounded-full object-cover z-10 border-2"
                          style={{ borderColor: teamColor }}
                        />
                        {isTouchdownPlay && (
                          <img
                            src="/assets/football_dance.gif"
                            alt="Football Dance"
                            className="w-16 h-full object-contain absolute top-2/3 td-dance"
                            style={{
                              animationDuration: `${passDurationMs + PASS_PAUSE_MS}ms`
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        }
        
        // Punt/Kickoff - high arc trajectory with football and headshot at end
        if (playViz.animate === 'punt' || playViz.animate === 'kickoff' || playViz.animate === 'kickoff-fail') {
          // Use type field to identify kicker and returner
          const kicker = resolvedAthletes.find(a => (a as any).type === 'kicker' || (a as any).type === 'punter');
          const returner = resolvedAthletes.find(a => (a as any).type === 'returner' || (a as any).type === 'return');
          const kickerAthlete = kicker || resolvedAthletes[0];
          const kickerHeadshot = getHeadshotUrl({ id: kickerAthlete?.id, headshot: kickerAthlete?.headshot });
          const kickerColor = getTeamColorForTeamId(kickerAthlete?.team?.id);
          // Returner should be the second athlete if not found by type (don't use the kicker as fallback)
          const returnerAthlete = returner || resolvedAthletes.find(a => a.id !== kickerAthlete?.id) || resolvedAthletes[1];
          const returnerHeadshot = getHeadshotUrl({ id: returnerAthlete?.id, headshot: returnerAthlete?.headshot });
          let returnerColor = getTeamColorForTeamId(returnerAthlete?.team?.id);
          // If team id missing or matches kicker color, flip to opposite color to avoid collisions
          if (!returnerAthlete?.team?.id || returnerColor === kickerColor) {
            returnerColor = kickerColor === '#FAAFE8' ? '#00FFE7' : '#FAAFE8';
          }
          
          // Use pass-arc for the kick, rush-slide for the return
          const kickStartX = kickStartYard !== null ? 10 + (kickStartYard * 0.8) : baseStartX;
          const kickLandX = kickEndYard !== null ? 10 + (kickEndYard * 0.8) : baseEndX;
                const returnStartX = returnStartYard !== null ? 10 + (returnStartYard * 0.8) : kickLandX;
          const returnEndX = returnEndYard !== null ? 10 + (returnEndYard * 0.8) : baseEndX;
          
          const kickDistance = kickLandX - kickStartX;
          const returnDistance = returnEndX - returnStartX;
          const fieldWidth = fieldRef.current?.offsetWidth || 1000;
          const kickDistancePx = (kickDistance / 100) * fieldWidth;
          const returnDistancePixels = (returnDistance / 100) * fieldWidth;
          const needsReturnNudge = Math.abs(returnDistance) < 1; // e.g. touchback shows no movement
          const fallbackReturnSign = kickDistance === 0 ? 1 : -Math.sign(kickDistance || -1); // run opposite kick direction
          const effectiveReturnDistancePixels = needsReturnNudge
            ? fallbackReturnSign * 24 // minimal visible slide so "rush" is apparent
            : returnDistancePixels;
          
          
          return (
            <>
              {/* Kicker headshot at kick start position */}
              {kickerAthlete && (
                <div
                  key={`kicker-${playKey}-${loopCycle}`}
                  className="absolute z-20"
                  style={{
                    left: `${kickStartX}%`,
                    top: `${headshotTopPercent}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <div className="relative group">
                    <div 
                      className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl"
                      style={{
                        backgroundColor: `${playViz.color}30`,
                        boxShadow: `0 0 20px ${playViz.glowColor}`
                      }}
                    >
                      <img
                        src={kickerHeadshot || '/assets/football.png'}
                        alt={kickerAthlete?.displayName || 'Kicker'}
                        className="w-12 h-12 rounded-full object-cover z-1 border-2"
                        style={{ borderColor: kickerColor }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Phase 1: Football arc (reuse pass-arc animation) */}
              <div
                key={`kick-arc-${playKey}-${kickStartX}-${kickLandX}-${loopCycle}`}
                className="absolute z-20"
                style={{ 
                  left: `${kickStartX}%`,
                  top: `${headshotTopPercent}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div
                  style={{
                    '--distance': kickDistance,
                    '--distance-px': `${kickDistancePx}px`,
                    '--arc-height': `${Math.abs(kickDistance) * 2.5}px`,
                    animation: `${playViz.animate === 'kickoff-fail' ? 'pass-incomplete' : 'pass-arc'} ${kickArcDurationMs || 5000}ms linear 0s 1 forwards`,
                    opacity: 1,
                    willChange: 'transform, opacity'
                  } as React.CSSProperties}
                  onAnimationEnd={() => {
                    console.log('🏁 Kick arc animation ended');
                    setKickDone(true);
                    setReturnStarted(true);
                    setBallFade(true);
                  }}
                >
                  <img
                    src="/assets/football_spin.gif"
                    alt="Football"
                    className="w-8 h-8 object-contain"
                    style={{
                      filter: `drop-shadow(0 0 10px ${playViz.glowColor})`,
                      animation: ballFade ? 'fadeOutFast 400ms linear 0s 1 forwards' : 'none'
                    }}
                  />
                </div>
              </div>

              {/* Receiver headshot always present at landing spot; animates only after kick completes */}
              {(() => {
                const shouldShowReturn = playViz.animate !== 'kickoff-fail' && returnerAthlete;
                const showReturnPhase = shouldShowReturn;
                const canSlide = (Math.abs(returnDistance) > 1 || needsReturnNudge) && (kickDone || returnStarted);

                return showReturnPhase ? (
                  <div
                    key={`kick-return-${playKey}-${loopCycle}`}
                    className="absolute z-10"
                    style={{ 
                      left: `calc(${returnStartX}% - 10px)`,
                      top: `${headshotTopPercent}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    {canSlide ? (
                      <div
                        style={{
                          '--distance': `${effectiveReturnDistancePixels}px`,
                          animation: `rush-slide ${returnSlideDurationMs || RUSH_ANIMATION_MS}ms linear 0s 1 forwards`
                        } as React.CSSProperties}
                      >
                        <div className="relative group">
                          <div 
                            className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl"
                            style={{
                              backgroundColor: `${playViz.color}30`,
                              boxShadow: `0 0 20px ${playViz.glowColor}`
                            }}
                          >
                            {returnerAthlete && (
                              <img
                                src={returnerHeadshot || '/assets/football.png'}
                                alt={returnerAthlete?.displayName || 'Player'}
                                className="w-12 h-12 rounded-full object-cover z-1 border-2"
                                style={{ borderColor: returnerColor }}
                              />
                            )}
                            {!returnerAthlete && (
                              <FaFootballBall className="text-2xl" style={{ color: playViz.color }} />
                            )}
                          </div>
                          <div 
                            className="absolute -right-1 top-1/2 transform -translate-y-1/3 -rotate-45"
                            style={{
                              filter: `drop-shadow(0 0 8px ${playViz.glowColor})`
                            }}
                          >
                            <img
                              src="/assets/football.png"
                              alt="Football"
                              className="w-8 h-8 object-contain"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="relative group">
                        <div 
                          className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl"
                          style={{
                            backgroundColor: `${playViz.color}30`,
                            boxShadow: `0 0 20px ${playViz.glowColor}`
                          }}
                        >
                          {returnerAthlete && (
                            <img
                              src={returnerHeadshot || '/assets/football.png'}
                              alt={returnerAthlete?.displayName || 'Player'}
                              className="w-12 h-12 rounded-full object-cover z-1 border-2"
                              style={{ borderColor: returnerColor }}
                            />
                          )}
                          {!returnerAthlete && (
                            <FaFootballBall className="text-2xl" style={{ color: playViz.color }} />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null;
              })()}
            </>
          );
        }
        
        // Field Goal - arc trajectory with headshot at end
        if (playViz.animate === 'field-goal') {
          return (
            <>
              {/* Football arc */}
              <div
                key={`fg-arc-${playKey}-${loopCycle}`}
                className="absolute z-20"
                style={{ 
                  left: `${baseStartX}%`,
                  top: `${headshotTopPercent}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div
                  className="animate-field-goal-arc"
                  style={{
                    '--distance': distance
                  } as React.CSSProperties}
                >
                  <img
                    src="/assets/football_spin.gif"
                    alt="Football"
                    className="w-8 h-8 object-contain"
                    style={{
                      filter: `drop-shadow(0 0 10px ${playViz.glowColor})`
                    }}
                  />
                </div>
              </div>
              
              {/* Headshot at end position */}
              <div
                key={`fg-head-${playKey}-${loopCycle}`}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                style={{ 
                  left: `${baseEndX}%`,
                  top: `${headshotTopPercent}%`
                }}
              >
                <div className="relative group">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl"
                    style={{
                      backgroundColor: `${playViz.color}30`,
                      boxShadow: `0 0 20px ${playViz.glowColor}`
                    }}
                  >
                    {hasPrimaryAthlete && (
                      <img
                        src={primaryHeadshot || '/assets/football.png'}
                        alt={primaryAthlete?.displayName || 'Player'}
                        className="w-12 h-12 rounded-full object-cover z-1 border-2"
                        style={{ borderColor: teamColor }}
                      />
                    )}
                    {!hasPrimaryAthlete && (
                      <FaFootballBall className="text-2xl" style={{ color: playViz.color }} />
                    )}
                  </div>
                </div>
              </div>
            </>
          );
        }
        
        // Penalty - greyscale headshot at end with gesture emojis
        if (playViz.animate === 'penalty') {
          return (
            <>
              <div
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                style={{ 
                  left: `${baseEndX}%`,
                  top: `${headshotTopPercent}%`
                }}
              >
                <div className="relative group">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl"
                    style={{
                      backgroundColor: `${playViz.color}30`,
                      boxShadow: `0 0 20px ${playViz.glowColor}`
                    }}
                  >
                    {hasPrimaryAthlete && (
                      <img
                        src={primaryHeadshot || '/assets/football.png'}
                        alt={primaryAthlete?.displayName || 'Player'}
                        className="w-12 h-12 rounded-full object-cover z-1 border-2"
                        style={{ 
                          borderColor: teamColor,
                          filter: 'grayscale(100%)'
                        }}
                      />
                    )}
                    {!hasPrimaryAthlete && (
                      <FaFootballBall className="text-2xl" style={{ color: playViz.color }} />
                    )}
                  </div>
                </div>
              </div>
              {/* Penalty gesture emojis on both sides */}
                <div
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 text-2xl"
                style={{ 
                  left: `${baseEndX - 8}%`,
                  top: `${headshotTopPercent}%`,
                  filter: `drop-shadow(0 0 10px ${playViz.glowColor})`
                }}
                >
                🙅🏻‍♂️
                </div>
                <div
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 text-2xl"
                style={{ 
                  left: `${baseEndX + 8}%`,
                  top: `${headshotTopPercent}%`,
                  filter: `drop-shadow(0 0 10px ${playViz.glowColor})`
                }}
                >
                🙅🏾‍♂️
                </div>
            </>
          );
        }
        
        // Fumble - ball carrier rushes, fumbles the ball (bounces), then recovered by opponent
        if (playViz.animate === 'fumble' || playViz.animate === 'fumble-rush') {
          const isRushFumble = playViz.animate === 'fumble-rush';
          
          // Use type field to identify ball carrier (rusher/passer) and recoverer
          const ballCarrier = resolvedAthletes.find(a => 
            (a as any).type === 'rusher' || 
            (a as any).type === 'ballcarrier' || 
            (a as any).type === 'passer'
          ) || resolvedAthletes[0]; // First athlete is ball carrier
          
          const recoverer = resolvedAthletes.find(a => 
            (a as any).type === 'fumble recovery' || 
            (a as any).type === 'recovery'
          ) || resolvedAthletes[resolvedAthletes.length - 1]; // Last athlete is usually the recoverer
          
          const ballCarrierHeadshot = getHeadshotUrl({ id: ballCarrier?.id, headshot: ballCarrier?.headshot });
          const recovererHeadshot = getHeadshotUrl({ id: recoverer?.id, headshot: recoverer?.headshot });
          const recovererTeamColor = recoverer?.team?.id === homeTeam?.id ? '#FAAFE8' : '#00FFE7';
          
          if (isRushFumble) {
            // Rush fumble: ball carrier runs with ball, fumbles, ball bounces, then recovered
            const rushDistance = baseEndX - baseStartX;
            const rushDistancePx = (rushDistance / 100) * fieldWidthPx;
            const fumblePointPercent = 0.7; // Fumbles 70% of the way
            const fumblePointX = baseStartX + (rushDistance * fumblePointPercent);
            const rushToFumblePx = rushDistancePx * fumblePointPercent;
            const rushDirection = Math.sign(rushDistancePx);
            const footballOnRight = rushDirection >= 0;
            
            // Recoverer starts near fumble point
            const recovererStartX = fumblePointX + rushDirection * 2;
            const recovererDistancePx = ((baseEndX - recovererStartX) / 100) * fieldWidthPx;
            
            return (
              <React.Fragment key={`fumble-rush-${playKey}-${loopCycle}`}>
                {/* Ball carrier rushes with football */}
                <div
                  className="absolute z-10"
                  style={{ 
                    left: `${baseStartX}%`,
                    top: `${headshotTopPercent}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <div
                    style={{
                      animation: `headshot-follow 1400ms linear 0s 1 forwards`,
                      '--distance-px': `${rushToFumblePx}px`
                    } as React.CSSProperties}
                  >
                    <div className="relative group">
                      <div 
                        className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl"
                        style={{
                          backgroundColor: `${playViz.color}30`,
                          boxShadow: `0 0 20px ${playViz.glowColor}`
                        }}
                      >
                        {ballCarrier && (
                          <img
                            src={ballCarrierHeadshot || '/assets/football.png'}
                            alt={ballCarrier?.displayName || 'Ball Carrier'}
                            className="w-12 h-12 rounded-full object-cover z-10 border-2"
                            style={{ borderColor: teamColor }}
                          />
                        )}
                      </div>
                      {/* Football being carried */}
                      <div 
                        className={`absolute top-1/2 transform -translate-y-1/3 -rotate-45 ${footballOnRight ? '-right-1' : '-left-1'}`}
                        style={{
                          filter: `drop-shadow(0 0 8px ${playViz.glowColor})`,
                          transform: footballOnRight ? 'translateY(-33%) rotate(-45deg)' : 'translateY(-33%) rotate(45deg) scaleX(-1)',
                          animation: 'fadeOutFast 200ms linear 1200ms 1 forwards'
                        }}
                      >
                        <img
                          src="/assets/football.png"
                          alt="Football"
                          className="w-8 h-8 object-contain"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Football bounces at fumble point */}
                <div
                  className="absolute z-20"
                  style={{ 
                    left: `${fumblePointX}%`,
                    top: `${headshotTopPercent}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <div
                    style={{
                      '--distance-px': `${((baseEndX - fumblePointX) / 100) * fieldWidthPx}px`,
                      '--arc-height': `${Math.abs(rushDistance) * 1.8}px`,
                      animation: `pass-incomplete 2200ms linear 1400ms 1 forwards`,
                      opacity: 0,
                      animationFillMode: 'both'
                    } as React.CSSProperties}
                  >
                    <img
                      src="/assets/football_spin.gif"
                      alt="Football"
                      className="w-8 h-8 object-contain"
                      style={{
                        filter: `drop-shadow(0 0 10px ${playViz.glowColor})`
                      }}
                    />
                  </div>
                </div>
                
                {/* Recoverer runs to grab it */}
                {recoverer && (
                  <div
                    className="absolute z-10"
                    style={{ 
                      left: `${recovererStartX}%`,
                      top: `${headshotTopPercent}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <div
                      style={{
                        animation: `headshot-follow 1600ms linear 2000ms 1 forwards`,
                        '--distance-px': `${recovererDistancePx}px`
                      } as React.CSSProperties}
                    >
                      <div className="relative group">
                        <div 
                          className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl"
                          style={{
                            backgroundColor: `${playViz.color}30`,
                            boxShadow: `0 0 20px ${playViz.glowColor}`
                          }}
                        >
                          <img
                            src={recovererHeadshot || '/assets/football.png'}
                            alt={recoverer?.displayName || 'Recoverer'}
                            className="w-12 h-12 rounded-full object-cover z-10 border-2"
                            style={{ borderColor: recovererTeamColor }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          }
          
          // Pass fumble: QB at line, ball arcs forward then bounces (fumble), recovered by opponent
          // Identify QB (usually first) and recoverer (usually last)
          const qb = qbAthlete || resolvedAthletes[0];
          const qbHeadshot = getHeadshotUrl({ id: qb?.id, headshot: qb?.headshot });
          
          // Ball arcs from QB to fumble point
          const fumblePointYard = passStartYard + (Math.sign(distance) || 1) * Math.abs(passEndYard - passStartYard) * 0.5;
          const fumblePointX = headshotX(fumblePointYard);
          const passToFumbleDistance = (fumblePointX - passStartX) / 100 * fieldWidthPx;
          
          // Recoverer starts near fumble point and grabs it
          const recovererStartX = fumblePointX + (Math.sign(distance) || 1) * 2;
          const recovererDistancePx = ((passEndX - recovererStartX) / 100) * fieldWidthPx;
          
          return (
            <React.Fragment key={`fumble-${playKey}-${loopCycle}`}>
              {/* QB stays at line (stationary) */}
              <div
                className="absolute z-10"
                style={{ 
                  left: `${passStartX}%`,
                  top: `${headshotTopPercent}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className="relative group">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl"
                    style={{
                      backgroundColor: `${playViz.color}30`,
                      boxShadow: `0 0 20px ${playViz.glowColor}`
                    }}
                  >
                    {qb && (
                      <img
                        src={qbHeadshot || '/assets/football.png'}
                        alt={qb?.displayName || 'QB'}
                        className="w-12 h-12 rounded-full object-cover z-10 border-2"
                        style={{ borderColor: teamColor }}
                      />
                    )}
                  </div>
                </div>
              </div>
              
              {/* Football arcs from QB then fumbles/bounces */}
              <div
                className="absolute z-20"
                style={{ 
                  left: `${passStartX}%`,
                  top: `${headshotTopPercent}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div
                  style={{
                    '--distance-px': `${passToFumbleDistance}px`,
                    '--arc-height': `${Math.abs(distance) * 2}px`,
                    animation: `pass-arc 1400ms linear 0s 1 forwards`,
                    willChange: 'transform, opacity'
                  } as React.CSSProperties}
                >
                  <img
                    src="/assets/football_spin.gif"
                    alt="Football"
                    className="w-8 h-8 object-contain"
                    style={{
                      filter: `drop-shadow(0 0 10px ${playViz.glowColor})`
                    }}
                  />
                </div>
              </div>
              
              {/* Football bounces at fumble point */}
              <div
                className="absolute z-20"
                style={{ 
                  left: `${fumblePointX}%`,
                  top: `${headshotTopPercent}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div
                  style={{
                    '--distance-px': `${((passEndX - fumblePointX) / 100) * fieldWidthPx}px`,
                    '--arc-height': `${Math.abs(distance) * 1.5}px`,
                    animation: `pass-incomplete 2200ms linear 1400ms 1 forwards`,
                    opacity: 0,
                    animationFillMode: 'both'
                  } as React.CSSProperties}
                >
                  <img
                    src="/assets/football_spin.gif"
                    alt="Football"
                    className="w-8 h-8 object-contain"
                    style={{
                      filter: `drop-shadow(0 0 10px ${playViz.glowColor})`
                    }}
                  />
                </div>
              </div>
              
              {/* Recoverer runs to grab it */}
              {recoverer && (
                <div
                  className="absolute z-10"
                  style={{ 
                    left: `${recovererStartX}%`,
                    top: `${headshotTopPercent}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <div
                    style={{
                      animation: `headshot-follow 1600ms linear 2000ms 1 forwards`,
                      '--distance-px': `${recovererDistancePx}px`
                    } as React.CSSProperties}
                  >
                    <div className="relative group">
                      <div 
                        className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl"
                        style={{
                          backgroundColor: `${playViz.color}30`,
                          boxShadow: `0 0 20px ${playViz.glowColor}`
                        }}
                      >
                        <img
                          src={recovererHeadshot || '/assets/football.png'}
                          alt={recoverer?.displayName || 'Recoverer'}
                          className="w-12 h-12 rounded-full object-cover z-10 border-2"
                          style={{ borderColor: recovererTeamColor }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        }
        
        // Sack - rusher slides in, QB sits at spot and gets bumped/rolled on impact
        if (playViz.animate === 'sack') {
          const distancePercent = baseEndX - baseStartX;
          const fieldWidth = fieldRef.current?.offsetWidth || 1000;
          const distancePixels = (distancePercent / 100) * fieldWidth;
          const hitRollPx = Math.max(40, Math.min(Math.abs(distancePixels) * 0.35, 120));
          const hitRollSigned = (Math.sign(distancePercent) || 1) * hitRollPx;
          const hitRotSign = Math.sign(hitRollSigned) || 1;

          // Use type field to identify sacker/rusher vs QB
          const rusherAthlete = resolvedAthletes.find(a => 
            (a as any).type === 'sacker' || 
            (a as any).type === 'defense'
          ) || primaryAthlete;

          return (
            <>
              {/* Rusher sliding in */}
              <div
                key={`sack-rusher-${playKey}-${loopCycle}`}
                className="absolute z-20"
                style={{ 
                  left: `${baseStartX}%`,
                  top: `${headshotTopPercent}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div
                  className="animate-sack-rush"
                  style={{
                    '--distance': `${distancePixels}px`
                  } as React.CSSProperties}
                >
                  <div className="relative group">
                    <div 
                      className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl"
                      style={{
                        backgroundColor: `${playViz.color}30`,
                        boxShadow: `0 0 20px ${playViz.glowColor}`
                      }}
                    >
                      {hasPrimaryAthlete && (
                        <img
                          src={primaryHeadshot || '/assets/football.png'}
                          alt={primaryAthlete?.displayName || 'Player'}
                          className="w-12 h-12 rounded-full object-cover z-1 border-2"
                          style={{ borderColor: teamColor }}
                        />
                      )}
                      {!hasPrimaryAthlete && (
                        <FaFootballBall className="text-2xl" style={{ color: playViz.color }} />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* QB waiting and getting bumped */}
              <div
                key={`sack-qb-${playKey}-${loopCycle}`}
                className="absolute z-10"
                style={{ 
                  left: `${baseEndX}%`,
                  top: `${headshotTopPercent}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div
                  className="animate-qb-sacked"
                  style={{ '--hit-x': `${hitRollSigned}px`, '--hit-rot-sign': hitRotSign } as React.CSSProperties}
                >
                  <div className="relative group">
                    <div 
                      className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl bg-black/30"
                      style={{
                        backgroundColor: `${playViz.color}20`,
                        boxShadow: `0 0 14px ${playViz.glowColor}`
                      }}
                    >
                      {qbHeadshotUrl ? (
                        <img
                          src={qbHeadshotUrl}
                          alt={qbAthlete?.displayName || 'QB'}
                          className="w-12 h-12 rounded-full object-cover z-1 border-2"
                          style={{ borderColor: teamColor }}
                        />
                      ) : (
                        <div className="text-2xl" style={{ color: playViz.color }}>
                          🤕
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          );
        }
        
        // Default - static position at end
        return (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
            style={{ 
              left: `${baseEndX}%`,
              top: `${headshotTopPercent}%`
            }}
          >
            <div className="relative group">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl"
                style={{
                  backgroundColor: `${playViz.color}30`,
                  boxShadow: `0 0 20px ${playViz.glowColor}`
                }}
              >
                {hasPrimaryAthlete && (
                  <img
                    src={primaryHeadshot || '/assets/football.png'}
                    alt={primaryAthlete?.displayName || 'Player'}
                    className="w-12 h-12 rounded-full object-cover z-1 border-2"
                    style={{ borderColor: teamColor }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        const fallback = document.createElement('div');
                        fallback.className = 'flex items-center justify-center text-2xl';
                        fallback.innerHTML = playViz.icon;
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                )}
                {!hasPrimaryAthlete && (
                  <FaFootballBall className="text-2xl" style={{ color: playViz.color }} />
                )}
              </div>
              {/* Player name tooltip */}
              <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-bg-darker border rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-[9999]"
                style={{ borderColor: `${playViz.color}80` }}
              >
                <p className="text-xs font-bold" style={{ color: playViz.color }}>{primaryAthlete?.displayName || 'Player'}</p>
                <p className="text-text-muted text-xs">{primaryAthlete?.position || ''}</p>
              </div>
            </div>
          </div>
        );
    })()}

    </div> {/* overlay */}
    </div> {/* field container */}

    {/* Latest Play - Only show if showGameInfo is true */}
    {showGameInfo && lastPlay && (() => {
        const latestPlay = lastPlay;
        const team = latestPlay.possession === homeTeam?.id ? homeTeam : awayTeam;
        const quarter = (latestPlay as any).quarter;
        const clock = (latestPlay as any).clock;
        const isHome = team?.id === homeTeam?.id;

        return (
          <div className="mt-4">
            <div className="text-text-muted text-xs mb-2 flex items-center gap-2">
              <FaFootballBall className="text-neon-cyan" />
              Latest Play
            </div>
            <div className={`bg-gradient-to-r ${isHome ? 'from-neon-pink/10' : 'from-neon-cyan/10'} rounded-lg p-3 border-l-2 ${isHome ? 'border-neon-pink' : 'border-neon-cyan'}`}>
              <div className="flex items-center gap-2 mb-2">
                <img src={getTeamLogo(team?.team)} alt="" className="w-5 h-5" />
                <span className={`text-xs font-bold ${isHome ? 'text-neon-pink' : 'text-neon-cyan'}`}>
                  {quarter ? `Q${quarter}` : ''} {clock || ''}
                </span>
              </div>
              
              {/* Player headshots */}
              {latestPlay.athletesInvolved && latestPlay.athletesInvolved.length > 0 && (
                <div className="flex gap-2 mb-2">
                  {latestPlay.athletesInvolved.slice(0, 3).map((athlete: any, idx: number) => (
                    athlete.headshot && (
                      <div key={idx} className="flex items-center gap-1">
                        <img
                          src={athlete.headshot}
                          alt={athlete.displayName}
                          className="w-8 h-8 rounded-full border-2 border-neon-cyan/30"
                        />
                        <div className="flex flex-col">
                          <span className="text-text-light text-xs font-semibold">{athlete.shortName}</span>
                          <span className="text-text-muted text-[10px]">{athlete.position}</span>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              )}
              
              <p className="text-text-light text-xs">
                {latestPlay.text}
              </p>
            </div>
          </div>
        );
      })()}
    </div>
    </div>
  );
};

export default FootballField;
