import React from 'react';

import '../../../styles/basketball.css';

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
	type?: string | { text?: string; description?: string; displayName?: string } | null;
	team?: { id?: string } | string | null;
	possession?: string | null;
	clock?: string | null;
	quarter?: number | null;
	period?: number | null;
	scoreValue?: number | null;
}

interface BasketballCourtProps {
	homeTeam?: any;
	awayTeam?: any;
	lastPlay?: BasketballPlay | null;
	playLog?: BasketballPlay[];
	getTeamLogo: (team: any) => string;
	showGameInfo?: boolean;
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

const usePlayPositions = (side: PlaySide, label: string) => {
	return React.useMemo(() => {
		const centerY = 50 + (Math.random() * 12 - 6);
		const startX = side === 'home' ? 28 + Math.random() * 6 : side === 'away' ? 72 - Math.random() * 6 : 50;
		const endX = side === 'home' ? 72 - Math.random() * 4 : side === 'away' ? 28 + Math.random() * 4 : 50;
		const endY = 50 + (Math.random() * 8 - 4);

		// Emphasize verticality for dunks/layups
		const apexOffset = label === 'dunk' || label === 'layup' ? 18 : 12;
		const depthY = centerY - apexOffset;

		return {
			['--sx' as const]: `${startX}%`,
			['--sy' as const]: `${centerY}%`,
			['--ex' as const]: `${endX}%`,
			['--ey' as const]: `${endY}%`,
			['--mx' as const]: `${(startX + endX) / 2}%`,
			['--my' as const]: `${depthY}%`,
		} as React.CSSProperties;
	}, [side, label]);
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
}) => {
	const lastPlay = lastPlayProp ?? playLog[0];
	const typeText = resolvePlayType(lastPlay);
	const label = derivePlayLabel(typeText, lastPlay) as keyof typeof playClassByLabel;
	const possessionId = (lastPlay?.team as any)?.id || (typeof lastPlay?.team === 'string' ? lastPlay?.team : undefined) || lastPlay?.possession || undefined;
	const side: PlaySide = possessionId
		? possessionId === homeTeam?.id
			? 'home'
			: possessionId === awayTeam?.id
				? 'away'
				: 'neutral'
		: 'neutral';

	const positions = usePlayPositions(side, label);
	const [cycle, setCycle] = React.useState(0);

	React.useEffect(() => {
		setCycle((c) => c + 1);
	}, [lastPlay?.id, lastPlay?.text, typeText, possessionId]);

	const config = playClassByLabel[label] || playClassByLabel.other;

	return (
		<div className="basketball-wrapper">
			<div className="basketball-court">
				<div className="court-lines" />
				<div className="half-line" />
				<div className="center-circle" />
				<div className="paint paint-left" />
				<div className="paint paint-right" />
				<div className="three-arc three-left" />
				<div className="three-arc three-right" />
				<div className="hoop hoop-left" />
				<div className="hoop hoop-right" />

				<div key={`trail-${cycle}`} className={`play-trail ${config.trail || ''}`} style={positions}>
					<span>{config.icon}</span>
				</div>
				<div key={`ball-${cycle}`} className={`play-ball ${config.ball}`} style={{ ...positions, ['--play-color' as any]: config.color }}>
					<span className="play-ball-icon">{config.icon}</span>
				</div>

				<div className="team-badge team-left">
					{homeTeam && (
						<>
							<img src={getTeamLogo(homeTeam)} alt={homeTeam?.displayName || 'home logo'} />
							<div className="team-meta">
								<span className="team-name">{homeTeam?.displayName || homeTeam?.shortDisplayName}</span>
								{typeof homeTeam?.score !== 'undefined' && <span className="team-score">{homeTeam.score}</span>}
							</div>
						</>
					)}
				</div>

				<div className="team-badge team-right">
					{awayTeam && (
						<>
							<div className="team-meta align-right">
								<span className="team-name">{awayTeam?.displayName || awayTeam?.shortDisplayName}</span>
								{typeof awayTeam?.score !== 'undefined' && <span className="team-score">{awayTeam.score}</span>}
							</div>
							<img src={getTeamLogo(awayTeam)} alt={awayTeam?.displayName || 'away logo'} />
						</>
					)}
				</div>
			</div>

			{showGameInfo && lastPlay && (
				<div className="play-banner" key={`banner-${cycle}`}>
					<div className="play-banner-type" style={{ color: config.color }}>
						{label.replace('-', ' ').toUpperCase()}
					</div>
					<div className="play-banner-text">{lastPlay.text || 'Live play unfolding...'}</div>
					<div className="play-banner-meta">
						<span>
							Q{lastPlay.quarter || lastPlay.period || '?'} · {lastPlay.clock || '0:00'}
						</span>
						{typeof lastPlay.scoreValue === 'number' && (
							<span className="points-tag">{lastPlay.scoreValue > 0 ? `+${lastPlay.scoreValue}` : `${lastPlay.scoreValue}`}</span>
						)}
					</div>
				</div>
			)}
		</div>
	);
};

export default BasketballCourt;
