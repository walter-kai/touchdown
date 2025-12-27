import React from 'react';
import { useLeague } from '@/providers/LeagueContext';
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

interface BasketballPlay {
	id?: string;
	text?: string;
	type?: string | { text?: string; description?: string; displayName?: string; id?: string } | null;
	team?: { id?: string } | string | null;
	possession?: string | null;
	possessionTeam?: { id?: string } | null;
	clock?: string | { displayValue?: string } | null;
	quarter?: number | null;
	period?: { number?: number; displayValue?: string } | number | null;
	scoreValue?: number | null;
	coordinate?: { x?: number; y?: number };
	shootingPlay?: boolean;
	scoringPlay?: boolean;
	participants?: Array<{
		athlete?: {
			id?: string;
			displayName?: string;
			headshot?: string;
			shortName?: string;
		};
		type?: string;
		order?: number;
	}>;
	athletesInvolved?: Array<{
		id?: string;
		displayName?: string;
		headshot?: string;
		shortName?: string;
		position?: string;
		team?: { id?: string };
	}>;
}

interface BasketballCourtProps {
	homeTeam?: any;
	awayTeam?: any;
	lastPlay?: BasketballPlay | null;
	playLog?: BasketballPlay[];
	getTeamLogo: (team: any) => string;
	showGameInfo?: boolean;
	showDiagnostics?: boolean;
}

const normalizeText = (value?: string | null) => (value || '').toString().trim();

const resolvePlayType = (play?: BasketballPlay | null) => {
	const raw = play?.type;
	if (!raw) return normalizeText(play?.text).toLowerCase();
	if (typeof raw === 'string') return normalizeText(raw).toLowerCase();
	return normalizeText(raw.text || raw.description || raw.displayName).toLowerCase();
};

const derivePlayLabel = (typeText: string, play?: BasketballPlay | null): PlayLabel => {
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

const playClassByLabel: Record<PlayLabel, { ball: string; trail?: string; color: string; icon: string }> = {
	three: { ball: 'animate-three-arc', trail: 'animate-three-arc-trail', color: '#ff7b5f', icon: '🏀' },
	dunk: { ball: 'animate-dunk-slam', trail: 'animate-dunk-slam', color: '#ffb703', icon: '🔥' },
	layup: { ball: 'animate-layup', trail: 'animate-layup-trail', color: '#7be0ff', icon: '✨' },
	'free-throw': { ball: 'animate-free-throw', trail: 'animate-free-throw-trail', color: '#80ffea', icon: '🎯' },
	hook: { ball: 'animate-hook-shot', trail: 'animate-hook-shot', color: '#ffd166', icon: '🌀' },
	'alley-oop': { ball: 'animate-alley-oop', trail: 'animate-alley-oop', color: '#ff9a8b', icon: '⚡' },
	jumper: { ball: 'animate-jumper', trail: 'animate-jumper-trail', color: '#a3ffb0', icon: '🏀' },
	'tip-in': { ball: 'animate-tip-in', trail: 'animate-tip-in', color: '#b5aaff', icon: '⬆️' },
	block: { ball: 'animate-block', trail: 'animate-block', color: '#ff5f7e', icon: '🛑' },
	steal: { ball: 'animate-steal', trail: 'animate-steal', color: '#80ffea', icon: '💨' },
	turnover: { ball: 'animate-turnover', trail: 'animate-turnover', color: '#f4c95d', icon: '⚠️' },
	rebound: { ball: 'animate-rebound', trail: 'animate-rebound', color: '#b3e5ff', icon: '🔁' },
	foul: { ball: 'animate-foul', trail: 'animate-foul', color: '#ffe066', icon: '🚩' },
	timeout: { ball: 'animate-timeout', trail: 'animate-timeout', color: '#e2e8f0', icon: '⏱️' },
	'fast-break': { ball: 'animate-fast-break', trail: 'animate-fast-break', color: '#00ffe7', icon: '⚡' },
	'end-period': { ball: 'animate-period', trail: 'animate-period', color: '#8b9bb4', icon: '🔔' },
	'start-period': { ball: 'animate-period', trail: 'animate-period', color: '#8b9bb4', icon: '🟢' },
	other: { ball: 'animate-jumper', trail: 'animate-jumper-trail', color: '#00ffe7', icon: '🏀' },
};

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
	const label = derivePlayLabel(typeText, lastPlay) as keyof typeof playClassByLabel;
	
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

	const [cycle, setCycle] = React.useState(0);

	React.useEffect(() => {
		setCycle((c) => c + 1);
	}, [lastPlay?.id, lastPlay?.text, typeText, possessionId]);

	const config = playClassByLabel[label] || playClassByLabel.other;

	// ESPN NBA court coordinates: X ranges from -250 to 250 (500 units), Y ranges from 0 to 470 (470 units)
	// Court dimensions: 94 feet long × 50 feet wide
	// Coordinate system: (0, 0) is center court, X is width, Y is length
	// Positive Y is towards one basket, negative Y is towards the other
	
	const courtWidthPx = courtRef.current?.offsetWidth || 1000;
	const courtHeightPx = courtRef.current?.offsetHeight || (courtWidthPx * 0.5625); // 16:9 aspect ratio
	
	// Map ESPN coordinates to court percentages
	const mapCoordinate = (coord?: { x?: number; y?: number }) => {
		if (!coord || coord.x === undefined || coord.y === undefined) {
			// Default to center court if no coordinates
			return { xPercent: 50, yPercent: 50 };
		}
		
		// ESPN court coordinates
		const espnX = coord.x;
		const espnY = coord.y;
		
		// Map X: -250 to 250 → 0% to 100% (left to right)
		const xPercent = ((espnX + 250) / 500) * 100;
		
		// Map Y: 0 to 470 → 0% to 100% (top to bottom)
		// Invert Y so 0 is at top (far end) and 470 is at bottom (near end)
		const yPercent = ((470 - espnY) / 470) * 100;
		
		return {
			xPercent: Math.max(0, Math.min(100, xPercent)),
			yPercent: Math.max(0, Math.min(100, yPercent))
		};
	};

	const shotLocation = mapCoordinate(lastPlay.coordinate);
	
	// Determine shot side based on Y coordinate and possession
	// Home team attacks towards Y=470 (bottom), away team attacks towards Y=0 (top)
	const possessionIsHome = possessionId === homeTeamId;
	const isHomeBasket = lastPlay.coordinate?.y ? lastPlay.coordinate.y > 235 : false; // Past half court
	const isAwayBasket = lastPlay.coordinate?.y ? lastPlay.coordinate.y < 235 : false;
	
	// Extract athlete data
	const athletes = React.useMemo(() => {
		if (lastPlay?.athletesInvolved?.length) return lastPlay.athletesInvolved;
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
		return [];
	}, [lastPlay?.athletesInvolved, lastPlay?.participants, lastPlay?.team]);

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
		<div className="space-y-2">
			{/* Court Diagnostics - Similar to Football Field Diagnostics */}
			{showGameInfo && (
				<div className="bg-bg-darker/50 border border-neon-cyan/20 rounded p-3 mb-4 text-xs font-mono">
					<div className="text-neon-cyan font-bold mb-2">🏀 Court Diagnostics</div>
					
					{/* ESPN Coordinates */}
					{lastPlay.coordinate && (
						<div className="mb-3 pb-3 border-b border-neon-cyan/10">
							<div className="text-neon-pink mb-1">Play Position (from ESPN):</div>
							<div className="grid grid-cols-2 gap-2">
								<div><span className="text-text-muted">ESPN X:</span> <span className="text-neon-cyan">{lastPlay.coordinate.x}</span></div>
								<div><span className="text-text-muted">ESPN Y:</span> <span className="text-neon-cyan">{lastPlay.coordinate.y}</span></div>
								<div><span className="text-text-muted">Court X:</span> <span className="text-neon-cyan">{shotLocation.xPercent.toFixed(1)}%</span></div>
								<div><span className="text-text-muted">Court Y:</span> <span className="text-neon-cyan">{shotLocation.yPercent.toFixed(1)}%</span></div>
							</div>
						</div>
					)}

					{/* Game State */}
					<div className="mb-3 pb-3 border-b border-neon-cyan/10">
						<div className="text-neon-pink mb-1">Game State:</div>
						<div className="grid grid-cols-2 gap-2">
							<div><span className="text-text-muted">Possession:</span> <span className="text-neon-cyan">{possessionTeamName}</span></div>
							<div><span className="text-text-muted">Direction:</span> <span className="text-neon-cyan">{attackingDirection}</span></div>
							<div><span className="text-text-muted">Period:</span> <span className="text-neon-cyan">{periodDisplay}</span></div>
							<div><span className="text-text-muted">Clock:</span> <span className="text-neon-cyan">{clockDisplay}</span></div>
						</div>
					</div>

					{/* Play Type */}
					<div>
						<div className="text-neon-pink mb-1">Play Type:</div>
						<div className="grid grid-cols-2 gap-2">
							<div><span className="text-text-muted">Type:</span> <span style={{ color: config.color }}>{label.replace('-', ' ').toUpperCase()}</span></div>
							<div><span className="text-text-muted">Points:</span> <span className="text-neon-cyan">{lastPlay.scoreValue || 0}</span></div>
						</div>
					</div>
				</div>
			)}

			{/* Basketball Court Field Container */}
			<div className="court-platform">
				<div ref={courtRef} className="basketball-court">
					<div className="court-lines" />
					<div className="half-line" />
					<div className="center-circle" />
					<div className="paint paint-left" />
					<div className="paint paint-right" />
					<div className="three-arc three-left" />
					<div className="three-arc three-right" />
					<div className="hoop hoop-left" />
					<div className="hoop hoop-right" />

				{/* Ball animation at shot location */}
				{lastPlay.coordinate && (
					<div 
						key={`ball-${cycle}`} 
						className={`play-ball-fixed ${config.ball}`}
						style={{
							left: `${shotLocation.xPercent}%`,
							top: `${shotLocation.yPercent}%`,
							['--play-color' as any]: config.color
						}}
					>
						<span className="play-ball-icon">{config.icon}</span>
					</div>
				)}

				{/* Primary athlete headshot */}
				{primaryAthlete && primaryHeadshot && lastPlay.coordinate && (
					<div
						key={`primary-${cycle}`}
						className="athlete-headshot-fixed primary-athlete"
						style={{
							left: `${shotLocation.xPercent}%`,
							top: `${shotLocation.yPercent}%`,
							['--athlete-color' as any]: getAthleteTeamColor((primaryAthlete.team as any)?.id),
						}}
					>
						<img
							src={primaryHeadshot}
							alt={primaryAthlete.displayName || primaryAthlete.shortName || ''}
							onError={(e) => (e.currentTarget.style.display = 'none')}
						/>
						<span className="athlete-name">{primaryAthlete.shortName || primaryAthlete.displayName}</span>
					</div>
				)}

				{/* Secondary athlete headshot (assister) */}
				{secondaryAthlete && secondaryHeadshot && lastPlay.coordinate && (
					<div
						key={`secondary-${cycle}`}
						className="athlete-headshot-fixed secondary-athlete"
						style={{
							left: `${Math.max(10, Math.min(90, shotLocation.xPercent + 8))}%`,
							top: `${Math.max(10, Math.min(90, shotLocation.yPercent - 5))}%`,
							['--athlete-color' as any]: getAthleteTeamColor((secondaryAthlete.team as any)?.id),
						}}
					>
						<img
							src={secondaryHeadshot}
							alt={secondaryAthlete.displayName || secondaryAthlete.shortName || ''}
							onError={(e) => (e.currentTarget.style.display = 'none')}
						/>
						<span className="athlete-name">{secondaryAthlete.shortName || secondaryAthlete.displayName}</span>
					</div>
				)}

			</div> {/* basketball-court */}
			</div> {/* relative container */}

			{/* Latest Play Info - Similar to FootballField */}
			{showGameInfo && lastPlay && (
				<div className="mt-4">
					<div className="text-text-muted text-xs mb-2 flex items-center gap-2">
						🏀 Latest Play
					</div>
					<div className={`bg-gradient-to-r ${possessionIsHome ? 'from-neon-pink/10' : 'from-neon-cyan/10'} rounded-lg p-3 border-l-2 ${possessionIsHome ? 'border-neon-pink' : 'border-neon-cyan'}`}>
						<div className="flex items-center gap-2 mb-2">
							<img src={getTeamLogo(possessionIsHome ? leftTeam : rightTeam)} alt="" className="w-5 h-5" />
							<span className={`text-xs font-bold ${possessionIsHome ? 'text-neon-pink' : 'text-neon-cyan'}`}>
								{periodDisplay} · {clockDisplay}
							</span>
							{typeof lastPlay.scoreValue === 'number' && lastPlay.scoreValue !== 0 && (
								<span className="ml-auto text-xs font-bold" style={{ color: config.color }}>
									{lastPlay.scoreValue > 0 ? `+${lastPlay.scoreValue}` : `${lastPlay.scoreValue}`} PTS
								</span>
							)}
						</div>
						{/* Player headshots */}
						{athletes.length > 0 && (
							<div className="flex gap-2 mb-2">
								{athletes.slice(0, 3).map((athlete, idx) => {
									const headshot = getHeadshotUrl({ id: athlete.id, headshot: athlete.headshot });
									return headshot ? (
										<div key={idx} className="flex items-center gap-1">
											<img
												src={headshot}
												alt={athlete.displayName}
												className="w-8 h-8 rounded-full border-2 border-neon-cyan/30"
												onError={(e) => (e.currentTarget.style.display = 'none')}
											/>
											<div className="flex flex-col">
												<span className="text-text-light text-xs font-semibold">{athlete.shortName || athlete.displayName}</span>
												<span className="text-text-muted text-[10px]">{athlete.position}</span>
											</div>
										</div>
									) : null;
								})}
							</div>
						)}
						
						<p className="text-text-light text-xs">
							{lastPlay.text || 'Live play unfolding...'}
						</p>
					</div>
				</div>
			)}
		</div>
	);
};

export default BasketballCourt;

	