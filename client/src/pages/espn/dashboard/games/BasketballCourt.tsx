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
	| 'substitution'
	| 'other';

interface BasketballCourtProps {
	homeTeam?: any;
	awayTeam?: any;
	lastPlay?: PlayNba | null;
	playLog?: PlayNba[];
	getTeamLogo: (team: any) => string;
	showGameInfo?: boolean;
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
	if (/jumper|jump shot|fadeaway|pullup|pull up|pull-up|driving|stepback|step back|step-back/.test(typeText)) return 'jumper';
	if (/tip|putback/.test(typeText)) return 'tip-in';
	if (/block/.test(typeText)) return 'block';
	if (/steal/.test(typeText)) return 'steal';
	if (/turnover|bad pass|lost ball|travel/.test(typeText)) return 'turnover';
	if (/rebound/.test(typeText)) return 'rebound';
	if (/foul/.test(typeText)) return 'foul';
	if (/timeout|time out/.test(typeText)) return 'timeout';
	if (/fast break|transition/.test(typeText)) return 'fast-break';
	if (/substitution|sub |enters/.test(typeText)) return 'substitution';
	if (/end of|end period|end quarter|end game|end half/.test(typeText)) return 'end-period';
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

// Rebound-specific config
const reboundPlayConfig = { ball: 'animate-rebound-ball', trail: 'animate-rebound-ball', color: '#00ffe7', icon: '🏀' };

// End of period/game config (adopting football's end-of-regulation styling)
const endPeriodPlayConfig = { ball: 'animate-end-regulation', trail: 'animate-end-regulation', color: '#FF6B6B', glowColor: 'rgba(255, 107, 107, 0.8)' };

const BasketballCourt: React.FC<BasketballCourtProps> = ({
	homeTeam,
	awayTeam,
	lastPlay: lastPlayProp,
	playLog = [],
	getTeamLogo,
	showGameInfo = true,
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
	
	// Court orientation: Standard TV convention (Away left, Home right) - consistent throughout
	const computedLeft = awayTeam;
	const computedRight = homeTeam;
	const leftTeam = computedLeft;
	const rightTeam = computedRight;
	const leftTeamId = leftTeam?.id || leftTeam?.team?.id;
	const rightTeamId = rightTeam?.id || rightTeam?.team?.id;
	const homeOnLeft = leftTeamId === homeTeamId;

	// Determine possession before mapping coordinates (needed for free throw positioning)
	const possessionIsHome = possessionId === homeTeamId;

	// Offense basket by current orientation (teams switch at halftime)
	// In our mapping: y=0 → left basket, y=94 → right basket
	const offenseBasketY = possessionIsHome
		? (homeOnLeft ? 0 : 94)
		: (homeOnLeft ? 94 : 0);
	
	const side: PlaySide = possessionId
		? possessionId === homeTeamId ? 'home' : possessionId === awayTeamId ? 'away' : 'neutral'
		: 'neutral';

	const [cycle, setCycle] = React.useState(0);

	React.useEffect(() => {
		setCycle((c) => c + 1);
		try {
			if ((lastPlay as any)?.coordinate) {
				console.debug('[BasketballCourt] lastPlay', {
					id: (lastPlay as any)?.id,
					coord: (lastPlay as any)?.coordinate,
					label: derivePlayLabel(resolvePlayType(lastPlay), lastPlay)
				});
			}
		} catch {}
	}, [lastPlay?.id, lastPlay?.text, typeText, possessionId]);

	// Use foul config for personal fouls, rebound config for rebounds, end period config for end periods, default for everything else
	const config = label === 'foul' ? foulPlayConfig : label === 'rebound' ? reboundPlayConfig : label === 'end-period' ? endPeriodPlayConfig : defaultPlayConfig;

	// ESPN NBA court coordinates are in FEET:
	// - X: 0-50 feet (court width, left to right)
	// - Y: 0-94 feet (court length, far basket to near basket)
	// Court dimensions: 94 feet long × 50 feet wide
	// Home team attacks towards Y=94 (bottom/right basket)
	// Away team attacks towards Y=0 (top/left basket)
	
	// Play Animation System:
	// - shootingPlay flag indicates this is a shot attempt (ball animation shows arc to basket)
	// - scoringPlay flag indicates the ball went in (animation ends at basketball_post.png)
	// - coordinate provides the exact X,Y location where the play occurred on the court in feet
	// - If shootingPlay=true && scoringPlay=true: Ball animates from coordinate to basket (made shot)
	// - If shootingPlay=true && scoringPlay=false: Ball animates but misses (miss animation)
	// - If shootingPlay=false: Non-shooting play (no basket target, just position marker)

	// Treat ESPN sentinel coords (±214748XXX) or missing values as invalid
	const isValidCoordinate = (coord?: { x?: number; y?: number }) => {
		if (!coord) return false;
		const { x, y } = coord;
		if (x === undefined || y === undefined) return false;
		if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
		// Sentinel value check
		if (Math.abs(x) > 100000 || Math.abs(y) > 100000) return false;
		// Valid court range in feet
		if (x < 0 || x > 50 || y < 0 || y > 94) return false;
		return true;
	};
	
	const courtWidthPx = courtRef.current?.offsetWidth || 1000;
	const courtHeightPx = courtRef.current?.offsetHeight || (courtWidthPx * 0.5625); // 16:9 aspect ratio
	
	// Map ESPN coordinates (in feet) to court percentages
	const mapFeetToPercent = (feet: { x: number; y: number }) => {
		// Court padding to align with hoop images at ~3% from edges
		const horizontalMin = 0;   // left padding (%)
		const horizontalMax = 100;  // right padding (%)
		const verticalMin = 0;     // top padding (%)
		const verticalMax = 100;    // bottom padding (%)

		const xPercent = horizontalMin + (feet.y / 94) * (horizontalMax - horizontalMin);
		const yPercent = verticalMin + (feet.x / 50) * (verticalMax - verticalMin);
		return { xPercent, yPercent };
	};

	const mapCoordinate = (
		coord?: { x?: number; y?: number },
		playLabel?: PlayLabel,
		possessionIsHome?: boolean,
		adjustForOffense: boolean = true
	) => {
		// Court padding to align with hoop images at ~3% from edges
		const horizontalMin = 3;   // left padding (%)
		const horizontalMax = 97;  // right padding (%)
		const verticalMin = 5;     // top padding (%)
		const verticalMax = 95;    // bottom padding (%)

		// Free throws: always use hard-coded line positions so animations/headshots start from the same spot
		if (playLabel === 'free-throw') {
			let xPercent = offenseBasketY === 94 ? 76 : 25; // attacking right vs attacking left
			const yPercent = offenseBasketY === 94 ? 50 : 50; // center of court vertically

			// Apply perspective scaling
			

			return {
				xPercent,
				yPercent,
				hasCoordinates: isValidCoordinate(coord),
				isFreeThrow: true
			};
		}

		if (!isValidCoordinate(coord)) {
			// For 3-pointers without coords, position at 3-point arc
			if (playLabel === 'three') {
				return {
					xPercent: possessionIsHome ? 70 : 30,
					yPercent: possessionIsHome ? 25 : 75, // Behind arc near attacking basket
					hasCoordinates: false,
					isFreeThrow: false
				};
			}
			// For layups/dunks, position near basket
			if (playLabel === 'layup' || playLabel === 'dunk' || playLabel === 'alley-oop' || playLabel === 'tip-in') {
				return {
					xPercent: possessionIsHome ? 82 : 18, // Near basket but not at edge
					yPercent: possessionIsHome ? 18 : 82, // Close to attacking basket
					hasCoordinates: false,
					isFreeThrow: false
				};
			}
			// For jump shots/hooks, position at mid-range
			if (playLabel === 'jumper' || playLabel === 'hook') {
				return {
					xPercent: possessionIsHome ? 65 : 35,
					yPercent: possessionIsHome ? 30 : 70, // Mid-range attacking side
					hasCoordinates: false,
					isFreeThrow: false
				};
			}
			// For defensive plays (block, steal, rebound), position near defensive basket
			if (playLabel === 'block' || playLabel === 'steal' || playLabel === 'rebound') {
				return {
					xPercent: possessionIsHome ? 20 : 80,
					yPercent: possessionIsHome ? 75 : 25, // Near defensive basket
					hasCoordinates: false,
					isFreeThrow: false
				};
			}
			// Default to mid-court top of key (not dead center)
			return { xPercent: 50, yPercent: 50, hasCoordinates: false, isFreeThrow: false };
		}
		
		// ESPN court coordinates in feet
		const espnX = coord.x!; // 0-50 feet (court width)
		// Mirror Y when the offense is attacking the right basket so distances map from that hoop, not the far baseline
		const espnYRaw = coord.y!; // 0-94 feet (court length)
		const espnY = adjustForOffense && offenseBasketY === 94 ? 94 - espnYRaw : espnYRaw;

		// Our visual has baskets on the SIDES, so map:
		// - Horizontal position ← ESPN Y (0..94)
		// - Vertical position   ← ESPN X (0..50)
		let xPercent = horizontalMin + (espnY / 94) * (horizontalMax - horizontalMin);
		const yPercent = verticalMin + (espnX / 50) * (verticalMax - verticalMin);
		console.log('Raw coords:', { espnX, espnYRaw, espnY, offenseBasketY, playLabel });

		// Apply perspective scaling: as yPercent decreases (moves higher/back on trapezoid),
		// compress the X coordinate toward center to match the narrowing effect
		// Scale ranges from ~0.7 at top (yPercent=5) to 1.0 at bottom (yPercent=95)
		const perspectiveScale = 0.7 + (yPercent - verticalMin) / (verticalMax - verticalMin) * 0.3;
		const centerX = 50;
		xPercent = centerX + (xPercent - centerX) * perspectiveScale;

		return {
			xPercent,
			yPercent,
			hasCoordinates: true,
			isFreeThrow: playLabel === 'free-throw'
		};
	};

	const resolvedCoordinate = React.useMemo(() => {
		if (isValidCoordinate((lastPlay as any)?.coordinate)) return (lastPlay as any).coordinate;
		const fallback = playLog.find((p) => isValidCoordinate((p as any)?.coordinate));
		return (fallback as any)?.coordinate;
	}, [lastPlay, playLog]);

	const shotLocation = mapCoordinate(resolvedCoordinate, label, possessionIsHome);

	// Compute basket target from ESPN feet using current orientation
	const basketFeet = { x: 25, y: offenseBasketY };

	// Shot distance in feet using ESPN coordinates
	const shotDistanceFeet = (() => {
		if (!isValidCoordinate(resolvedCoordinate)) return undefined;
		const dx = (resolvedCoordinate!.x as number) - basketFeet.x;
		// Mirror Y when the offense attacks the right basket so distance is measured from the attacking hoop
		const adjustedY = offenseBasketY === 94 ? 94 - (resolvedCoordinate!.y as number) : (resolvedCoordinate!.y as number);
		const dy = adjustedY - basketFeet.y;
		return Math.sqrt(dx * dx + dy * dy);
	})();

	// Detect behind-the-net shots (very close to baseline, ~5 feet or less from attack line)
	const isBehindNetShot = shotDistanceFeet !== undefined && shotDistanceFeet < 5;
	
	const mappedBasket = mapCoordinate(basketFeet, undefined, possessionIsHome, false);
	
	// Calculate basket position for animation targeting
	// For behind-the-net shots, center on the post image (middle of hoop visual)
	// Otherwise use the hoop edge position
	// Baskets are positioned at left: 3% and right: 3% (which is 97% from left)
	const basketPosition = isBehindNetShot
		? {
				xPercent: mappedBasket.xPercent, // center of post
				yPercent: 50, // middle of court vertically
		}
		: {
				xPercent: mappedBasket.xPercent,
				yPercent: mappedBasket.yPercent
		};

	// Determine direction using pre-perspective horizontal positions to avoid flips from trapezoid scaling
	const baseHorizontalPercent = (espnYValue: number, mirrorForRight: boolean) => {
		const horizontalMin = 3;
		const horizontalMax = 97;
		const adjustedY = mirrorForRight ? 94 - espnYValue : espnYValue;
		return horizontalMin + (adjustedY / 94) * (horizontalMax - horizontalMin);
	};

	const shotRawXPercent = isValidCoordinate(resolvedCoordinate)
		? baseHorizontalPercent((resolvedCoordinate!.y as number), offenseBasketY === 94)
		: shotLocation.xPercent;
	const basketRawXPercent = baseHorizontalPercent(basketFeet.y, false); // hoops stay fixed to court sides

	// Keep the ball in front of the shooter regardless of attacking direction
	const attackingRight = basketRawXPercent >= shotRawXPercent;
	// For free throws and fouls, position at the same location as the dot. For other plays, apply offset.
	const headshotOffsetX = shotLocation.isFreeThrow ? 0 : label === 'foul' ? 5 : label === 'rebound' ? -25 : (attackingRight ? -12 : -15);
	const headshotOffsetY = shotLocation.isFreeThrow ? 0 : label === 'foul' ? 5 : label === 'rebound' ? -25 : -15;
	// Ball offset: opposite side of headshot
	// When attacking right, ball is on the right side of headshot
	// When attacking left, ball is on the left side of headshot
	const ballOffsetX = shotLocation.isFreeThrow ? (attackingRight ? 0 : -33) : (attackingRight ? 12 : -20);
	const ballOffsetY = shotLocation.isFreeThrow ? -25 : -15;
	// Reverse arc direction for behind-the-net shots so ball arcs backward toward hoop
	const arcDirectionAdjustment = isBehindNetShot ? -1 : 1;
	
	// Determine if this is a miss (shooting play but not scoring)
	const isMiss = lastPlay.shootingPlay && !lastPlay.scoringPlay;

	// Boost arc height for close-range shots so the ball clearly climbs over the hoop
	const shortDistanceBoost = (() => {
		if (shotDistanceFeet === undefined) return 10;
		const boost = 26 - shotDistanceFeet * 1.3; // taper to zero by ~20ft
		return Math.max(0, boost);
	})();
	const arcPeakOffsetPx = -100 - shortDistanceBoost; // main apex
	const arcMidOffsetPx = -30 - shortDistanceBoost * 0.6; // mid-flight lift
	const arcEndOffsetPx = -10 - shortDistanceBoost * 0.3; // settle near rim
	
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

	const primaryAthlete = athletes.find(a => 
		a.position?.toLowerCase().includes('shooter') || 
		a.position?.toLowerCase().includes('rebounder')
	) || athletes[0];
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
	const possessionTeamName = possessionIsHome 
		? (leftTeam?.shortDisplayName || leftTeam?.displayName || 'HOME')
		: (rightTeam?.shortDisplayName || rightTeam?.displayName || 'AWAY');
	const attackingDirection = offenseBasketY === 94 ? '→' : '←';

	return (
		<div className="space-y-2 relative">
		{/* Basketball Court Field Container with team logos integrated into perspective */}
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

					{/* Team Logos integrated into court perspective - positioned at sidelines */}
					{leftTeam && (
						<div
							className="absolute pointer-events-none"
							style={{
								left: '4%',
								top: '50%',
								transform: 'translateY(-50%)',
								zIndex: 20
							}}
						>
							<img
								src={getTeamLogo(leftTeam)}
								alt={(leftTeam as any)?.shortDisplayName || (leftTeam as any)?.displayName || 'Left Team'}
								className="opacity-90"
								style={{
									height: '30px',
									filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.5))'
								}}
							/>
						</div>
					)}
					{rightTeam && (
						<div
							className="absolute pointer-events-none"
							style={{
								right: '4%',
								top: '50%',
								transform: 'translateY(-50%)',
								zIndex: 20
							}}
						>
							<img
								src={getTeamLogo(rightTeam)}
								alt={(rightTeam as any)?.shortDisplayName || (rightTeam as any)?.displayName || 'Right Team'}
								className="opacity-90"
								style={{
									height: '30px',
									filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.5))'
								}}
							/>
						</div>
					)}
				</div> {/* basketball-court */}
			</div> {/* court-platform */}

			{/* Ball animation and player headshots - positioned to match court platform */}
			<div className="absolute pointer-events-none z-[150]" style={{
				left: '14px',
				right: '14px',
				top: '14px',
				height: courtRef.current?.offsetHeight || 'auto',
				['--container-width' as any]: courtRef.current?.offsetWidth ? `${courtRef.current.offsetWidth - 28}px` : '100%'
			}}>
				{/* Ball animation at shot location - Enhanced with shooting and scoring play detection */}
			{label !== 'end-period' && label !== 'substitution' && label !== 'timeout' && (
				<>
					<div 
						key={`ball-${cycle}`} 
				className={`play-ball-fixed ${label === 'jumper' ? 'animate-jump-shot-ball' : label === 'layup' ? 'animate-layup-ball' : label === 'alley-oop' ? 'animate-alley-oop-ball' : label === 'rebound' ? 'animate-rebound-ball' : shotLocation.isFreeThrow ? '' : config.ball} ${lastPlay.shootingPlay ? 'shooting-animation' : ''} ${lastPlay.scoringPlay ? 'scoring-animation' : ''} ${shotLocation.isFreeThrow ? 'free-throw-animation' : ''} ${isMiss ? 'miss-animation' : ''} ${!shotLocation.hasCoordinates ? 'no-coordinates' : ''}`}
						style={{
							left: `calc(${shotLocation.xPercent}% + ${ballOffsetX}px)`,
							top: `calc(${shotLocation.yPercent}% + ${ballOffsetY}px)`,
							['--play-color' as any]: config.color,
							['--is-shooting' as any]: lastPlay.shootingPlay ? '1' : '0',
							['--is-scoring' as any]: lastPlay.scoringPlay ? '1' : '0',
							['--is-miss' as any]: isMiss ? '1' : '0',
						['--basket-x' as any]: basketPosition.xPercent,
						['--basket-y' as any]: basketPosition.yPercent,
						['--shot-x' as any]: shotLocation.xPercent,
						['--shot-y' as any]: shotLocation.yPercent,
						['--lift-offset' as any]: '-60px',
						['--arc-direction' as any]: arcDirectionAdjustment.toString(),
						['--ball-offset-x' as any]: `${ballOffsetX}px`,
					['--arc-peak-offset' as any]: `${arcPeakOffsetPx}px`,
					['--arc-mid-offset' as any]: `${arcMidOffsetPx}px`,
					['--arc-end-offset' as any]: `${arcEndOffsetPx}px`,
							opacity: shotLocation.hasCoordinates ? 1 : 0.5,
						}}
						data-shooting={lastPlay.shootingPlay}
						data-scoring={lastPlay.scoringPlay}
						data-free-throw={shotLocation.isFreeThrow}
						data-miss={isMiss}
					>
						<span className="play-ball-icon">{config.icon}</span>
					</div>
					<div
						key={`coord-dot-${cycle}`}
						className="coordinate-marker-dot"
						style={{
							left: `${shotLocation.xPercent}%`,
							top: `${shotLocation.yPercent}%`,
							['--marker-color' as any]: getAthleteTeamColor((primaryAthlete?.team as any)?.id) || teamColor,
						}}
					/>
				</>
			)}
			{/* Primary athlete headshot - hidden for end period and substitution. Show team logo for team rebounds */}
			{label !== 'end-period' && label !== 'substitution' && (primaryAthlete && primaryHeadshot || (label === 'rebound' && !primaryAthlete)) && (
				<div
					key={`primary-${cycle}`}
					className={`athlete-headshot-fixed primary-athlete ${label === 'jumper' ? 'animate-jump-shot-player' : ''} ${label === 'layup' ? 'animate-layup' : ''} ${label === 'alley-oop' ? 'animate-alley-oop' : ''} ${label === 'rebound' ? 'animate-rebound-catch' : ''}`}
					style={{
						left: `calc(${shotLocation.xPercent}% + ${headshotOffsetX}px)`,
						top: `calc(${shotLocation.yPercent}% + ${headshotOffsetY}px)`,
						['--athlete-color' as any]: getAthleteTeamColor((primaryAthlete?.team as any)?.id),
						['--shot-x' as any]: `${shotLocation.xPercent}%`,
						['--shot-y' as any]: `${shotLocation.yPercent}%`,
						['--arc-direction' as any]: arcDirectionAdjustment.toString(),
					}}
				>
					<img
						src={primaryHeadshot || (label === 'rebound' && !primaryAthlete ? (possessionIsHome ? homeTeam.logo : awayTeam.logo) : '')}
						alt={primaryAthlete.displayName || primaryAthlete.shortName || ''}
						onError={(e) => (e.currentTarget.style.display = 'none')}
						style={{ filter: label === 'foul' ? 'grayscale(100%)' : 'none' }}
					/>
				</div>
			)}

		{/* Foul emojis on both sides */}
		{label === 'foul' && (
			<>
				<div
					className="absolute text-2xl pointer-events-none"
					style={{
						left: `calc(${shotLocation.xPercent}% - 45px)`,
						top: `calc(${shotLocation.yPercent}% - 15px)`,
						zIndex: 200
					}}
				>
					🙅🏻‍♂️
				</div>
				<div
					className="absolute text-2xl pointer-events-none z-200"
					style={{
						left: `calc(${shotLocation.xPercent}% + 15px)`,
						top: `calc(${shotLocation.yPercent}% - 15px)`,
						zIndex: 200
					}}
				>
					🙅🏾‍♂️
				</div>
			</>
		)}

				{/* End of period/game - show ad-style banner at center */}
				{label === 'end-period' && (
					<div
						className="absolute z-20 w-3/4 max-w-xl"
						style={{
							left: '50%',
							top: '40%',
							transform: 'translate(-50%, -50%)'
						}}
					>
						<div
							className="relative overflow-hidden rounded-xl shadow-2xl border-2"
							style={{
								background: 'linear-gradient(135deg, rgba(0,255,231,0.15), rgba(250,175,232,0.15))',
								borderColor: `${config.color}70`,
								boxShadow: `0 0 30px ${config.glowColor}`
							}}
						>
							<div className="absolute inset-0 opacity-30 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.08)_8px,transparent_8px,transparent_16px)]" />
							<div className="px-6 py-4 flex items-center justify-between gap-4">
								<span className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">Presented by</span>
								<span className="text-2xl font-extrabold" style={{ color: config.color }}>
									{lastPlay?.text || 'End of period'}
								</span>
								<span className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">Touchdown Live</span>
							</div>
						</div>
					</div>
				)}

				{/* Substitution - show two headshots with replacement animation */}
				{label === 'substitution' && (() => {
					// Parse substitution text: "PlayerIn enters the game for PlayerOut"
					const text = lastPlay?.text || '';
					const match = text.match(/(.+?)\s+enters\s+(?:the\s+)?game\s+for\s+(.+)/i);
					const playerInName = match?.[1]?.trim();
					const playerOutName = match?.[2]?.trim();
					
					// Try to find athletes from participants or athletesInvolved
					const allParticipants = athletes.length > 0 ? athletes : [];
					const playerIn = allParticipants.find(a => 
						a.displayName?.toLowerCase().includes(playerInName?.toLowerCase() || '') ||
						a.shortName?.toLowerCase().includes(playerInName?.toLowerCase() || '')
					) || allParticipants[0];
					const playerOut = allParticipants.find(a => 
						a.id !== playerIn?.id &&
						(a.displayName?.toLowerCase().includes(playerOutName?.toLowerCase() || '') ||
						a.shortName?.toLowerCase().includes(playerOutName?.toLowerCase() || ''))
					) || allParticipants[1];
					
					const playerInHeadshot = playerIn ? getHeadshotUrl({ id: playerIn.id, headshot: playerIn.headshot }) : '';
					const playerOutHeadshot = playerOut ? getHeadshotUrl({ id: playerOut.id, headshot: playerOut.headshot }) : '';
					
					return (
						<div
							key={`sub-${cycle}`}
							className="absolute z-20"
							style={{
								left: '50%',
								top: '45%',
								transform: 'translate(-50%, -50%)'
							}}
						>
							<div className="relative flex items-center justify-center" style={{ width: '240px', height: '100px' }}>
								{/* Player leaving (left side - outgoing) */}
								<div className="absolute left-8 top-1/2 transform -translate-y-1/2">
									<div 
										className="w-16 h-16 rounded-full flex items-center justify-center animate-sub-fade-out"
										style={{
											border: `3px solid ${teamColor}`,
											boxShadow: `0 0 20px ${teamColor}`,
											backgroundColor: 'rgba(0,0,0,0.3)'
										}}
									>
										{playerOutHeadshot ? (
											<img
												src={playerOutHeadshot}
												alt={playerOut?.displayName || 'Player Out'}
												className="w-full h-full rounded-full object-cover"
												onError={(e) => (e.currentTarget.style.display = 'none')}
											/>
										) : (
											<div className="text-4xl">👤</div>
										)}
									</div>
									<div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-xs font-bold text-white/60">
										{playerOut?.shortName || playerOutName || 'OUT'}
									</div>
								</div>

								{/* Dual arrow - centered */}
								<div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl animate-pulse" style={{ color: teamColor }}>
									⇄
								</div>

								{/* Player entering (right side - incoming, will slide left) */}
								<div className="absolute right-8 top-1/2 transform -translate-y-1/2 animate-sub-slide-replace">
									<div 
										className="w-16 h-16 rounded-full flex items-center justify-center"
										style={{
											border: `3px solid ${teamColor}`,
											boxShadow: `0 0 20px ${teamColor}`,
											backgroundColor: 'rgba(0,0,0,0.3)'
										}}
									>
										{playerInHeadshot ? (
											<img
												src={playerInHeadshot}
												alt={playerIn?.displayName || 'Player In'}
												className="w-full h-full rounded-full object-cover"
												onError={(e) => (e.currentTarget.style.display = 'none')}
											/>
										) : (
											<div className="text-4xl">👤</div>
										)}
									</div>
									<div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-xs font-bold" style={{ color: teamColor }}>
										{playerIn?.shortName || playerInName || 'IN'}
									</div>
								</div>
							</div>
						</div>
					);
				})()}
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

	