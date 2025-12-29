import React from 'react';
import { useLeague } from '@/providers/LeagueContext';
import { PlayNba } from '@/types/espn/plays';
import '@/styles/basketball.css';

type PlaySide = 'home' | 'away' | 'neutral';
type PlayLabel =
	| 'three'
	| 'dunk'
	| 'layup'
	| 'free-throw'
	| 'hook'
	| 'alley-oop'
	| 'jumper'
	| 'tip-in'
	| 'block'
	| 'steal'
	| 'turnover'
	| 'rebound'
	| 'foul'
	| 'timeout'
	| 'fast-break'
	| 'end-period'
	| 'start-period'
	| 'other';

interface BasketballCourtProps {
	homeTeam?: any;
	awayTeam?: any;
	lastPlay?: PlayNba | null;
	playLog?: PlayNba[];
	getTeamLogo: (team: any) => string;
	showGameInfo?: boolean;
	showDiagnostics?: boolean;
}

const normalizeText = (value?: string | null) => (value || '').toString().trim();

const resolvePlayType = (play?: PlayNba | null) => {
	const raw = play?.type;
	if (!raw) return normalizeText(play?.text).toLowerCase();
	if (typeof raw === 'string') return normalizeText(raw).toLowerCase();
	return normalizeText(raw.text || raw.description || raw.displayName).toLowerCase();
};

const derivePlayLabel = (typeText: string, play?: PlayNba | null): PlayLabel => {
	if (/three|3pt|3-pt|3 point/.test(typeText)) return 'three';
	if (/dunk/.test(typeText)) return 'dunk';
	if (/layup|floater|finger roll/.test(typeText)) return 'layup';
	if (/free throw/.test(typeText)) return 'free-throw';
	if (/hook/.test(typeText)) return 'hook';
	if (/alley|oop/.test(typeText)) return 'alley-oop';
	if (/jumper|jump shot|fadeaway/.test(typeText)) return 'jumper';
	if (/tip|putback/.test(typeText)) return 'tip-in';
	if (/block/.test(typeText)) return 'block';
	if (/steal/.test(typeText)) return 'steal';
	if (/turnover|bad pass|lost ball|travel/.test(typeText)) return 'turnover';
	if (/rebound/.test(typeText)) return 'rebound';
	if (/foul/.test(typeText)) return 'foul';
	if (/timeout|time out/.test(typeText)) return 'timeout';
	if (/fast break|transition/.test(typeText)) return 'fast-break';
	if (/end of|end period|end quarter/.test(typeText)) return 'end-period';
	if (/start of|jump ball/.test(typeText)) return 'start-period';
	const points = Number(play?.scoreValue || 0);
	if (points >= 3) return 'three';
	if (points === 2) return 'jumper';
	if (points === 1) return 'free-throw';
	return 'other';
};

// Simplified animation config (single style)
const defaultPlayConfig = { ball: 'animate-jumper', trail: 'animate-jumper-trail', color: '#00ffe7', icon: '🏀' };

// Foul-specific config (matches NFL penalty animation)
const foulPlayConfig = { ball: 'animate-foul', trail: 'animate-foul', color: '#FFFF00', icon: '🚩' };

const BasketballCourt: React.FC<BasketballCourtProps> = ({
	homeTeam,
	awayTeam,
	lastPlay: lastPlayProp,
	playLog = [],
	getTeamLogo,
	showGameInfo = true,
	showDiagnostics = false,
}) => {
	const { getHeadshotUrl } = useLeague();
	const courtRef = React.useRef<HTMLDivElement>(null);
	const [viewportWidth, setViewportWidth] = React.useState(() =>
		typeof window !== 'undefined' ? window.innerWidth : 1280
	);

	React.useEffect(() => {
		const handleResize = () => setViewportWidth(window.innerWidth);
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	if (!homeTeam || !awayTeam) return null;

	const lastPlay = lastPlayProp ?? playLog[0];
	if (!lastPlay) return null;

	const typeText = resolvePlayType(lastPlay);
	const label = derivePlayLabel(typeText, lastPlay);
	
	// Extract team IDs
	const homeTeamId = homeTeam?.id || homeTeam?.team?.id;
	const awayTeamId = awayTeam?.id || awayTeam?.team?.id;
	
	// Determine possession
	const possessionId = 
		(lastPlay?.possessionTeam as any)?.id ||
		(lastPlay?.team as any)?.id || 
		(typeof lastPlay?.team === 'string' ? lastPlay?.team : undefined) || 
		lastPlay?.possession;
	
	// Court orientation: Home team on left, Away team on right (standard TV convention)
	const leftTeam = homeTeam;
	const rightTeam = awayTeam;
	const leftTeamId = homeTeamId;
	const rightTeamId = awayTeamId;
	
	const side: PlaySide = possessionId
		? possessionId === homeTeamId ? 'home' : possessionId === awayTeamId ? 'away' : 'neutral'
		: 'neutral';

	// Determine possession before mapping coordinates (needed for free throw positioning)
	const possessionIsHome = possessionId === homeTeamId;

	const [cycle, setCycle] = React.useState(0);

	React.useEffect(() => {
		setCycle((c) => c + 1);
	}, [lastPlay?.id, lastPlay?.text, typeText, possessionId]);

	// Use foul config for personal fouls, default for everything else
	const config = label === 'foul' ? foulPlayConfig : defaultPlayConfig;

	// ESPN NBA court coordinates: X ranges from -250 to 250 (500 units), Y ranges from 0 to 470 (470 units)
	// Court dimensions: 94 feet long × 50 feet wide
	// Coordinate system: (0, 0) is center court, X is width, Y is length
	// Positive Y is towards one basket, negative Y is towards the other
	
	// Play Animation System:
	// - shootingPlay flag indicates this is a shot attempt (ball animation shows arc to basket)
	// - scoringPlay flag indicates the ball went in (animation ends at basketball_post.png)
	// - coordinate provides the exact X,Y location where the play occurred on the court
	// - If shootingPlay=true && scoringPlay=true: Ball animates from coordinate to basket (made shot)
	// - If shootingPlay=true && scoringPlay=false: Ball animates but misses (miss animation)
	// - If shootingPlay=false: Non-shooting play (no basket target, just position marker)
	
	const courtWidthPx = courtRef.current?.offsetWidth || 1000;
	const courtHeightPx = courtRef.current?.offsetHeight || (courtWidthPx * 0.5625); // 16:9 aspect ratio
	
	// Map ESPN coordinates to court percentages
	const mapCoordinate = (coord?: { x?: number; y?: number }, playLabel?: PlayLabel, possessionIsHome?: boolean) => {
		// Check for invalid/sentinel coordinates (ESPN uses large negative numbers like -214748340)
		const isInvalidCoord = !coord || 
			coord.x === undefined || 
			coord.y === undefined || 
			Math.abs(coord.x) > 100000 || 
			Math.abs(coord.y) > 100000;
		
		if (isInvalidCoord) {
			// For free throws, position at free throw line
			if (playLabel === 'free-throw') {
				// Free throw line is at 19 feet from baseline
				// Baskets are on left (5%) and right (95%) sides
				// For home team attacking right basket: X~85% (near right basket), Y=50% (center)
				// For away team attacking left basket: X~15% (near left basket), Y=50% (center)
				return {
					xPercent: possessionIsHome ? 77 : 23,
					yPercent: 50,
					hasCoordinates: false,
					isFreeThrow: true
				};
			}
			// Default to center court if no coordinates
			return { xPercent: 50, yPercent: 50, hasCoordinates: false, isFreeThrow: false };
		}
		
		// ESPN court coordinates
		const espnX = coord.x!;
		const espnY = coord.y!;
		
		// Map X: -250 to 250 → 0% to 100% (left to right)
		const xPercent = ((espnX + 250) / 500) * 100;
		
		// Map Y: 0 to 470 → 0% to 100% (top to bottom)
		// Invert Y so 0 is at top (far end) and 470 is at bottom (near end)
		const yPercent = ((470 - espnY) / 470) * 100;
		
		return {
			xPercent: Math.max(0, Math.min(100, xPercent)),
			yPercent: Math.max(0, Math.min(100, yPercent)),
			hasCoordinates: true,
			isFreeThrow: playLabel === 'free-throw'
		};
	};

	const shotLocation = mapCoordinate(lastPlay.coordinate, label, possessionIsHome);
	
	// Calculate basket position for free throw animation
	const basketPosition = {
		// Home team attacks right basket, away team attacks left basket
		xPercent: possessionIsHome ? 95 : 5,
		yPercent: 50  // Baskets are centered vertically on the sides
	};
	
	// Determine if this is a miss (shooting play but not scoring)
	const isMiss = lastPlay.shootingPlay && !lastPlay.scoringPlay;
	
	// Determine shot side based on Y coordinate and possession
	// Home team attacks towards Y=470 (bottom), away team attacks towards Y=0 (top)
	const isHomeBasket = lastPlay.coordinate?.y ? lastPlay.coordinate.y > 235 : false; // Past half court
	const isAwayBasket = lastPlay.coordinate?.y ? lastPlay.coordinate.y < 235 : false;
	
	// Extract athlete data - prefer lastPlay, but fall back to playLog[0] if empty
	const athletes = React.useMemo(() => {
		if (lastPlay?.athletesInvolved?.length) return lastPlay.athletesInvolved;
		if (playLog?.[0]?.athletesInvolved?.length) return playLog[0].athletesInvolved;
		if (lastPlay?.participants?.length) {
			return lastPlay.participants.map(p => ({
				id: (p.athlete as any)?.id || '',
				displayName: (p.athlete as any)?.displayName || '',
				headshot: (p.athlete as any)?.headshot || '',
				shortName: (p.athlete as any)?.shortName || '',
				position: p.type || '',
				team: lastPlay?.team as any
			}));
		}
		if (playLog?.[0]?.participants?.length) {
			return playLog[0].participants.map(p => ({
				id: (p.athlete as any)?.id || '',
				displayName: (p.athlete as any)?.displayName || '',
				headshot: (p.athlete as any)?.headshot || '',
				shortName: (p.athlete as any)?.shortName || '',
				position: p.type || '',
				team: playLog[0]?.team as any
			}));
		}
		return [];
	}, [lastPlay?.athletesInvolved, lastPlay?.participants, lastPlay?.team, playLog]);

	const primaryAthlete = athletes.find(a => a.position?.toLowerCase().includes('shooter')) || athletes[0];
	const secondaryAthlete = athletes.find(a => a.position?.toLowerCase().includes('assist')) || athletes[1];
	const primaryHeadshot = primaryAthlete ? getHeadshotUrl({ id: primaryAthlete?.id, headshot: primaryAthlete?.headshot }) : '';
	const secondaryHeadshot = secondaryAthlete ? getHeadshotUrl({ id: secondaryAthlete?.id, headshot: secondaryAthlete?.headshot }) : '';

	const teamColor = possessionIsHome ? '#FAAFE8' : '#00FFE7';
	
	const getAthleteTeamColor = React.useCallback(
		(teamId?: string) => {
			if (!teamId) return teamColor;
			return teamId === homeTeamId ? '#FAAFE8' : '#00FFE7';
		},
		[homeTeamId, teamColor]
	);

	// Get clock display
	const clockDisplay = typeof lastPlay.clock === 'string' 
		? lastPlay.clock 
		: (lastPlay.clock as any)?.displayValue || '0:00';
	
	// Get period display
	const periodNum = typeof lastPlay.period === 'number' 
		? lastPlay.period 
		: (lastPlay.period as any)?.number || lastPlay.quarter || 1;
	
	const periodDisplay = typeof lastPlay.period === 'object' && lastPlay.period !== null
		? (lastPlay.period as any).displayValue || `Q${periodNum}`
		: `Q${periodNum}`;

	// Direction indicator for possession
	const attackingDirection = possessionIsHome ? '→' : '←';
	const possessionTeamName = possessionIsHome 
		? (leftTeam?.shortDisplayName || leftTeam?.displayName || 'HOME')
		: (rightTeam?.shortDisplayName || rightTeam?.displayName || 'AWAY');

	return (
		<div className="space-y-2 relative">

			{/* Basketball Court Field Container */}
			<div className="court-platform relative">
				<div ref={courtRef} className="basketball-court">
					<div className="court-lines" />
					<div className="half-line" />
					<div className="center-circle" />
					<div className="paint paint-left" />
					<div className="paint paint-right" />
					<div className="free-throw-circle free-throw-left" />
					<div className="free-throw-circle free-throw-right" />
					<div className="three-arc three-left" />
					<div className="three-arc three-right" />
				</div> {/* basketball-court */}
			</div> {/* court-platform */}

			{/* Ball animation and player headshots - positioned to match court platform */}
			<div className="absolute pointer-events-none z-[50]" style={{
				left: '14px',
				right: '14px',
				top: '14px',
				height: courtRef.current?.offsetHeight || 'auto'
			}}>
				{/* Ball animation at shot location - Enhanced with shooting and scoring play detection */}
				<div 
					key={`ball-${cycle}`} 
					className={`play-ball-fixed ${config.ball} ${lastPlay.shootingPlay ? 'shooting-animation' : ''} ${lastPlay.scoringPlay ? 'scoring-animation' : ''} ${shotLocation.isFreeThrow ? 'free-throw-animation' : ''} ${isMiss ? 'miss-animation' : ''} ${!shotLocation.hasCoordinates ? 'no-coordinates' : ''}`}
					style={{
						left: `${shotLocation.xPercent}%`,
						top: `${shotLocation.yPercent}%`,
						['--play-color' as any]: config.color,
						['--is-shooting' as any]: lastPlay.shootingPlay ? '1' : '0',
						['--is-scoring' as any]: lastPlay.scoringPlay ? '1' : '0',
						['--is-miss' as any]: isMiss ? '1' : '0',
						['--basket-x' as any]: `${basketPosition.xPercent}%`,
						['--basket-y' as any]: `${basketPosition.yPercent}%`,
						['--lift-offset' as any]: '-60px',
						['--arc-direction' as any]: possessionIsHome ? '1' : '-1',
						opacity: shotLocation.hasCoordinates ? 1 : 0.5,
					}}
					data-shooting={lastPlay.shootingPlay}
					data-scoring={lastPlay.scoringPlay}
					data-free-throw={shotLocation.isFreeThrow}
					data-miss={isMiss}
				>
					<span className="play-ball-icon">{config.icon}</span>
				</div>

				{/* Coordinate marker dot on the court surface */}
				<div
					key={`coord-dot-${cycle}`}
					className="coordinate-marker-dot"
					style={{
						left: `${shotLocation.xPercent}%`,
						top: `${shotLocation.yPercent}%`,
						['--marker-color' as any]: getAthleteTeamColor((primaryAthlete?.team as any)?.id) || teamColor,
					}}
				/>

				{/* Primary athlete headshot */}
				{primaryAthlete && primaryHeadshot && (
					<div
						key={`primary-${cycle}`}
						className={`athlete-headshot-fixed primary-athlete ${shotLocation.isFreeThrow ? 'free-throw-headshot' : ''}`}
						style={{
							left: `${shotLocation.xPercent}%`,
							top: `${shotLocation.yPercent}%`,
							['--athlete-color' as any]: getAthleteTeamColor((primaryAthlete.team as any)?.id),
							opacity: shotLocation.hasCoordinates ? 1 : 0.6,
						}}
					>
						<img
							src={primaryHeadshot}
							alt={primaryAthlete.displayName || primaryAthlete.shortName || ''}
							onError={(e) => (e.currentTarget.style.display = 'none')}
							style={{ filter: label === 'foul' ? 'grayscale(100%)' : 'none' }}
						/>
		
					</div>
				)}

				{/* Secondary athlete headshot (assister) */}
				{secondaryAthlete && secondaryHeadshot && (
					<div
						key={`secondary-${cycle}`}
						className="athlete-headshot-fixed secondary-athlete"
						style={{
							left: `${Math.max(10, Math.min(90, shotLocation.xPercent + 8))}%`,
							top: `${Math.max(10, Math.min(90, shotLocation.yPercent - 5))}%`,
							['--athlete-color' as any]: getAthleteTeamColor((secondaryAthlete.team as any)?.id),
							opacity: shotLocation.hasCoordinates ? 1 : 0.6,
						}}
					>
						<img
							src={secondaryHeadshot}
							alt={secondaryAthlete.displayName || secondaryAthlete.shortName || ''}
							onError={(e) => (e.currentTarget.style.display = 'none')}
						/>
					</div>
				)}
				
				{/* Foul gesture emojis (like penalty refs in football) */}
				{label === 'foul' && (
					<>
						<div
							className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 text-2xl"
							style={{ 
								left: `${Math.max(5, shotLocation.xPercent - 8)}%`,
								top: `${shotLocation.yPercent}%`,
								filter: `drop-shadow(0 0 10px ${config.color})`
							}}
						>
							🙅🏻‍♂️
						</div>
						<div
							className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 text-2xl"
							style={{ 
								left: `${Math.min(95, shotLocation.xPercent + 8)}%`,
								top: `${shotLocation.yPercent}%`,
								filter: `drop-shadow(0 0 10px ${config.color})`
							}}
						>
							🙅🏾‍♂️
						</div>
					</>
				)}
			</div>

			{/* Basketball goal posts - positioned to match court bounds */}
			<div className="absolute pointer-events-none z-[100]" style={{
				left: '5px',
				right: '5px',
				top: '-10px',
				height: courtRef.current?.offsetHeight || 'auto'
			}}>
				<img 
					src="/assets/basketbal_post.png" 
					alt="Basketball Hoop" 
					className="absolute pointer-events-none h-12"
					style={{
						left: '3%',
						top: '50%',
						transform: 'translateY(-50%)'
					}}
				/>
				<img 
					src="/assets/basketbal_post.png" 
					alt="Basketball Hoop" 
					className="absolute pointer-events-none h-12 scale-x-[-1]"
					style={{
						right: '3%',
						top: '50%',
						transform: 'translateY(-50%) scaleX(-1)'
					}}
				/>
			</div>
		</div>
	);
};

export default BasketballCourt;

	