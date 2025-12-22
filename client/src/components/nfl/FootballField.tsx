import React from 'react';
import { FaFootballBall } from 'react-icons/fa';
import { Play, PlayType } from '@/types/espn/playByplay';
import '@/styles/football.css';
import { getHeadshotUrl } from '@/utils/headshot';
import { usePlays } from '@/providers/PlaysContext';

interface FootballFieldProps {
  homeTeam?: any;
  awayTeam?: any;
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
const getPlayVisualization = (playType?: PlayType | string | { text: string }) => {
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
  
  // Fumbles - Orange
  if (type.includes('fumble')) {
    return {
      color: '#FF8800',
      glowColor: 'rgba(255, 136, 0, 0.6)',
      icon: '⚠️',
      pattern: 'solid',
      width: 3,
      animate: 'shake'
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
      icon: '🕐',
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
      icon: '🕐',
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
  lastPlay: lastPlayProp,
  situation: situationProp,
  playLog: playLogProp = [],
  getTeamLogo,
  showGameInfo = false,
}) => {
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

  // Normalize team abbreviations for yard conversions
  const awayAbbr = awayTeam?.team?.abbreviation?.toUpperCase() || awayTeam?.abbreviation?.toUpperCase() || awayTeam?.shortDisplayName?.toUpperCase();
  const homeAbbr = homeTeam?.team?.abbreviation?.toUpperCase() || homeTeam?.abbreviation?.toUpperCase() || homeTeam?.shortDisplayName?.toUpperCase();
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
  const convertToFieldYard = (abbr?: string, yard?: number) => {
    if (yard === undefined || yard < 0 || yard > 100) return undefined;
    if (yard === 0 || yard === 100) return yard; // end zones stay at their absolute edges
    if (!abbr) return yard; // unknown team, assume left-to-right as-is
    if (abbrMatches(abbr, awayAbbr)) return yard; // left team keeps yard as-is
    if (abbrMatches(abbr, homeAbbr)) return 100 - yard; // flip for right team
    // Unrecognized team token: leave as-is to avoid stalling the animation
    return yard;
  };
  
  // Single source of truth for all headshot vertical positions
  const HEADSHOT_VERTICAL_POSITION = '64%';
  // Duration of the kickoff arc animation (matches animate-pass-arc duration)
  const KICK_ANIMATION_MS = 5000;
  // Duration of rush animation (matches rush-slide timing)
  const RUSH_ANIMATION_MS = 3000;
  const PLAY_LOOP_MS = KICK_ANIMATION_MS + RUSH_ANIMATION_MS + 600; // small buffer
  const clampYard = (yard: number) => Math.max(0, Math.min(100, yard));
  
  if (!lastPlay) return null;

  // Match the box score layout: away team on left, home team on right
  const leftTeam = awayTeam;
  const rightTeam = homeTeam;
  
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

  const qbHeadshot = getHeadshotUrl({ id: qbCandidate?.id, headshot: qbCandidate?.headshot });

  // Prefer athletes from lastPlay, but fall back to latest playLog entry when situation.lastPlay lacks participants
  const resolvedAthletes = React.useMemo(() => {
    if (lastPlay?.athletesInvolved?.length) return lastPlay.athletesInvolved;
    if (playLog?.[0]?.athletesInvolved?.length) return playLog[0].athletesInvolved;
    return [] as any[];
  }, [lastPlay?.athletesInvolved, playLog]);

  const primaryAthlete = resolvedAthletes[0] || qbCandidate;
  const primaryHeadshot = getHeadshotUrl({ id: primaryAthlete?.id, headshot: primaryAthlete?.headshot });
  const hasPrimaryAthlete = Boolean(primaryAthlete);

  // For kickoffs/punts, extract accurate yard lines from text since start/end data is unreliable
  let kickStartYard: number | null = null;
  let kickEndYard: number | null = null;
  let returnStartYard: number | null = null; // Where returner catches/recovers
  let returnEndYard: number | null = null; // Final position after return
  const isKickPlay = playViz.animate === 'punt' || playViz.animate === 'kickoff' || playViz.animate === 'kickoff-fail';
  
  if (debugLogs) console.log('🏈 Is kick play?', isKickPlay, 'playViz.animate:', playViz.animate);

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
      }, KICK_ANIMATION_MS);
      if (debugLogs) console.log('⏱️ Kick phase reset; will complete after', KICK_ANIMATION_MS, 'ms');
    } else {
      setKickPhaseComplete(true);
      setKickDone(false);
      setReturnStarted(true);
      setBallFade(true);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [playKey, isKickPlay, loopCycle]);

  // Loop the full kick->rush sequence for kick plays
  React.useEffect(() => {
    if (!isKickPlay) return;
    const loopTimer = setTimeout(() => setLoopCycle((c) => c + 1), PLAY_LOOP_MS);
    return () => clearTimeout(loopTimer);
  }, [isKickPlay, loopCycle, PLAY_LOOP_MS]);
  
  if (isKickPlay && lastPlay?.text) {
    // Extract "kicks XX yards from TEAM YY to TEAM ZZ" for kick trajectory
    const kickMatch = lastPlay.text.match(/kicks\s+\d+\s+yards\s+from\s+(\w+)\s+(\d+)\s+to\s+(\w+)\s+(\d+)/i);
    const toEndZoneMatch = lastPlay.text.match(/kicks\s+\d+\s+yards\s+from\s+(\w+)\s+(\d+)\s+to\s+(?:the\s+)?end zone/i);
    
    // Extract "recovers at TEAM YY" for muffed kicks
    const recoveryMatch = lastPlay.text.match(/recovers at\s+(\w+)\s+(\d+)/i);
    
    // Extract "to TEAM YY for ZZ yards" for return
    const returnMatch = lastPlay.text.match(/to\s+(\w+)\s+(\d+)\s+for\s+\d+\s+yards/i);
    
    if (kickMatch) {
      const kickTeamAbbr = kickMatch[1].toUpperCase();
      const kickYardLine = parseInt(kickMatch[2]);
      const landTeamAbbr = kickMatch[3].toUpperCase();
      const landYardLine = parseInt(kickMatch[4]);
      
      // Convert kick start position
      const isKickTeamLeft = kickTeamAbbr === awayTeam?.abbreviation?.toUpperCase() || 
                             kickTeamAbbr === awayTeam?.shortDisplayName?.toUpperCase();
      kickStartYard = isKickTeamLeft ? kickYardLine : (100 - kickYardLine);
      
      // Convert landing position (where ball first lands)
      const isLandTeamLeft = landTeamAbbr === awayTeam?.abbreviation?.toUpperCase() || 
                            landTeamAbbr === awayTeam?.shortDisplayName?.toUpperCase();
      kickEndYard = isLandTeamLeft ? landYardLine : (100 - landYardLine);
      
      // Default return start is where ball lands
      returnStartYard = kickEndYard;
    } else if (toEndZoneMatch) {
      // Touchback case
      const kickTeamAbbr = toEndZoneMatch[1].toUpperCase();
      const kickYardLine = parseInt(toEndZoneMatch[2]);
      
      const isKickTeamLeft = kickTeamAbbr === awayTeam?.abbreviation?.toUpperCase() || 
                             kickTeamAbbr === awayTeam?.shortDisplayName?.toUpperCase();
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
      
      const isRecoveryTeamLeft = recoveryTeamAbbr === awayTeam?.abbreviation?.toUpperCase() || 
                                 recoveryTeamAbbr === awayTeam?.shortDisplayName?.toUpperCase();
      returnStartYard = isRecoveryTeamLeft ? recoveryYardLine : (100 - recoveryYardLine);
    }
    
    // Get return end position if there's a return
    if (returnMatch) {
      const returnTeamAbbr = returnMatch[1].toUpperCase();
      const returnYardLine = parseInt(returnMatch[2]);
      
      const isReturnTeamLeft = returnTeamAbbr === awayTeam?.abbreviation?.toUpperCase() || 
                              returnTeamAbbr === awayTeam?.shortDisplayName?.toUpperCase();
      returnEndYard = isReturnTeamLeft ? returnYardLine : (100 - returnYardLine);
    } else {
      // No return, final position is where ball was caught/recovered
      returnEndYard = returnStartYard;
    }
    
    if (debugLogs) {
      console.log('🏈 KICK YARD LINE PARSING:', {
        text: lastPlay.text,
        kickStartYard,
        kickEndYard,
        returnStartYard,
        returnEndYard,
        awayTeam: awayTeam?.abbreviation,
        homeTeam: homeTeam?.abbreviation,
        hasAthletes: !!lastPlay.athletesInvolved,
        athleteCount: lastPlay.athletesInvolved?.length || 0
      });
    }
  }
  
  // Possession-based normalization: away (left) drives left->right, home (right) drives right->left
  const possessionIsHome = situation?.possession === homeTeam?.id;
  const possessionAbbr = possessionIsHome ? homeAbbr : awayAbbr;
  const possessionDirection = possessionIsHome ? -1 : 1; // home drives right-to-left on this field layout
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


  // Force scoring plays to end at the correct goal line so touchdowns reach the end zone, and backfill a reasonable start if distance is known
  const isTouchdownPlay = ((getPlayTypeText(lastPlay) || '').toLowerCase().includes('touchdown')) || ((lastPlay?.text || '').toLowerCase().includes('touchdown'));
  const distanceMatch = lastPlay.text?.match(/for\s+(\d+)\s+yards/i);
  const distanceYards = distanceMatch ? parseInt(distanceMatch[1], 10) : undefined;

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

  return (
    <div className="space-y-6">
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

            {/* Timeouts - Only show if showGameInfo is true */}
      {/* {showGameInfo && situation && ( */}
        <div className="flex justify-between items-center">
          <div className="text-center">
            <p className="text-text-muted text-xs mb-1">{awayTeam?.team.abbreviation} Timeouts</p>
            <div className="flex gap-1 justify-center">
              {[...Array(3)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-3 h-3 rounded-full ${
                    i < ((situation as any)?.awayTimeouts ?? 3) 
                      ? 'bg-neon-cyan' 
                      : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
          
          {/* Play Type Display */}
          {getPlayTypeText(lastPlay) && (
            <div className="flex-1 text-center">
              <p className="text-text-muted text-xs mb-1">Play Type</p>
              <p className="font-bold text-sm" style={{ color: playViz.color }}>
                {getPlayTypeText(lastPlay)}
              </p>
            </div>
          )}
          
          <div className="text-center">
            <p className="text-text-muted text-xs mb-1">{homeTeam?.team.abbreviation} Timeouts</p>
            <div className="flex gap-1 justify-center">
              {[...Array(3)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-3 h-3 rounded-full ${
                    i < ((situation as any)?.homeTimeouts ?? 3) 
                      ? 'bg-neon-pink' 
                      : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      {/* )} */}

      {/* Football Field */}
      <div className={showGameInfo ? "border-t border-neon-cyan/10 pt-6" : ""}>
    <div ref={fieldRef} className="relative w-full bg-gradient-to-b from-green-700 to-green-800 rounded-lg" style={{ height: '200px' }}>
      {/* End zones - 10% each */}
      <div className="absolute left-0 top-0 bottom-0 w-[10%] bg-blue-900/40 flex items-center justify-center">
        <img src={getTeamLogo(leftTeam?.team)} alt="" className="w-12 h-12 opacity-60" />
      </div>
      <div className="absolute right-0 top-0 bottom-0 w-[10%] bg-red-900/40 flex items-center justify-center">
        <img src={getTeamLogo(rightTeam?.team)} alt="" className="w-12 h-12 opacity-60" />
      </div>

      {/* Playing field - 80% between end zones */}
      {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((fieldPercent) => {
        const actualPosition = 10 + (fieldPercent * 0.8);
        const yardNumber = fieldPercent <= 50 ? fieldPercent : 100 - fieldPercent;
        
        return (
          <div
            key={fieldPercent}
            className="absolute top-0 bottom-0 border-l border-white/20"
            style={{ left: `${actualPosition}%` }}
          >
            {fieldPercent % 10 === 0 && (
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-white/40 text-xs font-bold">
                {yardNumber}
              </div>
            )}
          </div>
        );
      })}

      {/* 50 yard line highlight */}
      <div className="absolute top-0 bottom-0 left-[50%] w-0.5 bg-yellow-400/30" />

      {/* Start position dot - positioned at arrow/football level */}
      {playStartYard !== undefined && playViz.animate !== 'timeout' && playViz.animate !== 'two-minute-warning' && playViz.animate !== 'end-regulation' && (
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2"
          style={{ 
            left: `${10 + (playStartYard * 0.8)}%`,
            top: HEADSHOT_VERTICAL_POSITION
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
        <>
          {/* Arc path for punts/kickoffs */}
          {playViz.animate === 'arc' && (
            <svg
              className="absolute left-0 top-0 w-full h-full pointer-events-none"
            >
              <path
                d={`M ${10 + (playStartYard * 0.8)}%,${HEADSHOT_VERTICAL_POSITION} Q ${10 + ((playStartYard + playEndYard) / 2 * 0.8)}%,13% ${10 + (playEndYard * 0.8)}%,${HEADSHOT_VERTICAL_POSITION}`}
                stroke={playViz.color}
                strokeWidth={playViz.width}
                fill="none"
                opacity="0.5"
                strokeDasharray="4,2"
              />
            </svg>
          )}

          {/* Standalone arrowhead at end position */}
          <div
            className="absolute"
            style={{
              left: `${10 + (playEndYard * 0.8)}%`,
              top: HEADSHOT_VERTICAL_POSITION,
              transform: `translate(-50%, -50%) rotate(${playEndYard > playStartYard ? 0 : 180}deg)`
            }}
          >
            <div
              style={{
                width: 0,
                height: 0,
                borderTop: '7px solid transparent',
                borderBottom: '7px solid transparent',
                borderLeft: `22px solid ${playViz.color}`,
                filter: `drop-shadow(0 0 10px ${playViz.glowColor})`
              }}
            />
          </div>

          {/* Play type icon at midpoint - only show for fail cases */}
          {playViz.icon === '🚫' && (
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 text-2xl z-20"
              style={{
                left: `${10 + ((playStartYard + playEndYard) / 2 * 0.8)}%`,
                top: '50%',
                filter: `drop-shadow(0 0 8px ${playViz.glowColor})`
              }}
            >
              {playViz.icon}
            </div>
          )}
        </>
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
        const baseStartX = 10 + (resolvedStartYard * 0.8);
        const baseEndX = 10 + (resolvedEndYard * 0.8);
        // Use raw start/end yard lines to keep arrow and animation aligned
        const passStartX = 10 + (passStartYard * 0.8);
        const passEndX = 10 + (passEndYard * 0.8);
        const distance = passEndX - passStartX;
        const fieldWidthPx = fieldRef.current?.offsetWidth || 1000;
        const signedDistancePx = distance / 100 * fieldWidthPx;
        const distancePx = Math.abs(signedDistancePx);
        const passDurationMs = Math.min(Math.max(distancePx * 5, 900), 4800); // clamp for fluid speed
        const PASS_PAUSE_MS = 2000;
        
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
          
          console.log('Rush animation:', { startX: baseStartX, endX: baseEndX, distancePercent, fieldWidth, distanceWithOffset, hasGain });
          
          return (
            <>
              {/* Headshot with football starts at dot */}
              <div
                key={`rush-${getStartYard(lastPlay)}-${getEndYard(lastPlay)}`}
                className="absolute z-10"
                style={{ 
                  left: `${baseStartX}%`,
                  top: HEADSHOT_VERTICAL_POSITION,
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
                          style={{ borderColor: playViz.color }}
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
        
        // Pass animations - football spins with headshot following
        if (playViz.animate === 'pass-complete' || playViz.animate === 'pass-incomplete') {
          const headshotOffsetPx = 20; // keep the receiver slightly offset so the ball lands beside the headshot
          const headshotOffsetPercent = (headshotOffsetPx / fieldWidthPx) * 100;
          const headshotStartX = passStartX + (Math.sign(distance) || 1) * -headshotOffsetPercent;
          return (
            <React.Fragment key={`pass-${playKey}`}>
              {/* Football animation */}
              <div
                className="absolute z-20"
                style={{ 
                  left: `${passStartX}%`,
                  top: HEADSHOT_VERTICAL_POSITION,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div
                  style={{
                    '--distance': distance,
                    '--distance-px': `${signedDistancePx}px`,
                    '--arc-height': `${Math.abs(distance) * 2.5}px`,
                    animation: `${playViz.animate === 'pass-complete' ? 'pass-arc' : 'pass-incomplete'} ${passDurationMs + PASS_PAUSE_MS}ms cubic-bezier(0.4, 0.0, 0.2, 1) 0s 1 forwards`,
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
              
              {/* Headshot follows */}
              <div
                className="absolute z-10"
                style={{ 
                  left: `${headshotStartX}%`,
                  top: HEADSHOT_VERTICAL_POSITION,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div
                  style={{
                    '--distance': distance,
                    '--distance-px': `${signedDistancePx}px`,
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
                        {hasPrimaryAthlete && (
                          <img
                            src={primaryHeadshot || '/assets/football.png'}
                            alt={primaryAthlete?.displayName || 'Player'}
                            className="w-12 h-12 rounded-full object-cover z-10 border-2"
                            style={{ borderColor: playViz.color }}
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
                          style={{
                            animationDuration: `${passDurationMs + PASS_PAUSE_MS}ms`
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        }
        
        // Punt/Kickoff - high arc trajectory with football and headshot at end
        if (playViz.animate === 'punt' || playViz.animate === 'kickoff' || playViz.animate === 'kickoff-fail') {
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
          
          console.log('🏈 KICKOFF/PUNT ANIMATION SETUP:', { 
            kickStartX,
            kickLandX,
            returnStartX,
            returnEndX,
            kickDistance,
            returnDistance,
            returnDistancePixels,
            needsReturnNudge,
            effectiveReturnDistancePixels,
            kickDone,
            returnStarted,
            playType: playViz.animate,
            isKickoffFail: playViz.animate === 'kickoff-fail',
            hasAthletes: !!lastPlay.athletesInvolved,
            athleteCount: lastPlay.athletesInvolved?.length || 0,
            returnDistanceAbs: Math.abs(returnDistance),
            willShowRush: playViz.animate !== 'kickoff-fail' && hasPrimaryAthlete
          });
          
          return (
            <>
              {/* Phase 1: Football arc (reuse pass-arc animation) */}
              <div
                key={`kick-arc-${playKey}-${kickStartX}-${kickLandX}-${loopCycle}`}
                className="absolute z-20"
                style={{ 
                  left: `${kickStartX}%`,
                  top: HEADSHOT_VERTICAL_POSITION,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div
                  style={{
                    '--distance': kickDistance,
                    '--distance-px': `${kickDistancePx}px`,
                    '--arc-height': `${Math.abs(kickDistance) * 2.5}px`,
                    animation: `${playViz.animate === 'kickoff-fail' ? 'pass-incomplete' : 'pass-arc'} ${KICK_ANIMATION_MS}ms linear 0s 1 forwards`,
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
                const shouldShowReturn = playViz.animate !== 'kickoff-fail' && hasPrimaryAthlete;
                const showReturnPhase = shouldShowReturn;
                const canSlide = (Math.abs(returnDistance) > 1 || needsReturnNudge) && (kickDone || returnStarted);
                console.log('🏈 RETURN ANIMATION CHECK:', {
                  shouldShowReturn,
                  showReturnPhase,
                  kickDone,
                  returnStarted,
                  kickPhaseComplete,
                  isNotKickoffFail: playViz.animate !== 'kickoff-fail',
                  hasAthletes: !!lastPlay.athletesInvolved,
                  hasFirstAthlete: hasPrimaryAthlete,
                  returnDistance: Math.abs(returnDistance),
                  willSlide: canSlide,
                  needsReturnNudge
                });
                return showReturnPhase ? (
                  <div
                    key={`kick-return-${playKey}-${loopCycle}`}
                    className="absolute z-10"
                    style={{ 
                      left: `${returnStartX}%`,
                      top: HEADSHOT_VERTICAL_POSITION,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    {canSlide ? (
                      <div
                        style={{
                          '--distance': `${effectiveReturnDistancePixels}px`,
                          animation: `rush-slide ${RUSH_ANIMATION_MS}ms linear 0s 1 forwards`
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
                                style={{ borderColor: playViz.color }}
                              />
                            )}
                            {!hasPrimaryAthlete && (
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
                          {hasPrimaryAthlete && (
                            <img
                              src={primaryHeadshot || '/assets/football.png'}
                              alt={primaryAthlete?.displayName || 'Player'}
                              className="w-12 h-12 rounded-full object-cover z-1 border-2"
                              style={{ borderColor: playViz.color }}
                            />
                          )}
                          {!hasPrimaryAthlete && (
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
                className="absolute z-20"
                style={{ 
                  left: `${baseStartX}%`,
                  top: HEADSHOT_VERTICAL_POSITION,
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
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                style={{ 
                  left: `${baseEndX}%`,
                  top: HEADSHOT_VERTICAL_POSITION
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
                        style={{ borderColor: playViz.color }}
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
                  top: HEADSHOT_VERTICAL_POSITION
                }}
              >
                <div className="relative group">
                  <div 
                    className="w-20 h-16 rounded-full flex items-center justify-center shadow-2xl"
                    style={{
                      backgroundColor: `${playViz.color}30`,
                      boxShadow: `0 0 20px ${playViz.glowColor}`
                    }}
                  >
                    {hasPrimaryAthlete && (
                      <img
                        src={primaryHeadshot || '/assets/football.png'}
                        alt={primaryAthlete?.displayName || 'Player'}
                        className="w-14 h-14 rounded-full object-cover z-1 border-2"
                        style={{ 
                          borderColor: playViz.color,
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
                  top: HEADSHOT_VERTICAL_POSITION,
                  filter: `drop-shadow(0 0 10px ${playViz.glowColor})`
                }}
                >
                🙅🏻‍♂️
                </div>
                <div
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 text-2xl"
                style={{ 
                  left: `${baseEndX + 8}%`,
                  top: HEADSHOT_VERTICAL_POSITION,
                  filter: `drop-shadow(0 0 10px ${playViz.glowColor})`
                }}
                >
                🙅🏾‍♂️
                </div>
            </>
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

          const rusherAthlete = primaryAthlete;
          const qbAthlete = qbCandidate;
          const qbHeadshotUrl = qbHeadshot;

          return (
            <>
              {/* Rusher sliding in */}
              <div
                className="absolute z-20"
                style={{ 
                  left: `${baseStartX}%`,
                  top: HEADSHOT_VERTICAL_POSITION,
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
                          style={{ borderColor: playViz.color }}
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
                className="absolute z-10"
                style={{ 
                  left: `${baseEndX}%`,
                  top: HEADSHOT_VERTICAL_POSITION,
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
                          style={{ borderColor: playViz.color }}
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
              top: HEADSHOT_VERTICAL_POSITION
            }}
          >
            <div className="relative group">
              <div 
                className="w-20 h-16 rounded-full flex items-center justify-center shadow-2xl"
                style={{
                  backgroundColor: `${playViz.color}30`,
                  boxShadow: `0 0 20px ${playViz.glowColor}`
                }}
              >
                {hasPrimaryAthlete && (
                  <img
                    src={primaryHeadshot || '/assets/football.png'}
                    alt={primaryAthlete?.displayName || 'Player'}
                    className="w-14 h-14 rounded-full object-cover z-1 border-2"
                    style={{ borderColor: playViz.color }}
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
    </div>

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
