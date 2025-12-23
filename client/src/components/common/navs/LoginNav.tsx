import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import GoogleLoginButton from '../GoogleLoginButton';
import { useLeague, LeagueType } from '../../../providers/LeagueContext';
import { FaChevronDown, FaFootballBall, FaBasketballBall } from 'react-icons/fa';

const LoginNav = React.forwardRef<HTMLElement>((props, ref) => {
	const navigate = useNavigate();
	const { league, leagueConfig, setLeague } = useLeague();
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const leagues: { id: LeagueType; name: string; icon: React.ReactNode }[] = [
		{ id: 'nfl', name: 'NFL Drive', icon: <FaFootballBall className="text-neon-cyan" /> },
		{ id: 'nba', name: 'NBA Drive', icon: <FaBasketballBall className="text-orange-500" /> },
	];

	const handleLeagueChange = (newLeague: LeagueType) => {
		setLeague(newLeague);
		setDropdownOpen(false);
		// Force a full page reload to ensure all components reinitialize with new league
		// Navigate to the games grid for the selected league
		window.location.href = `/${newLeague}/games`;
	};

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setDropdownOpen(false);
			}
		};

		if (dropdownOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [dropdownOpen]);

	return (
		<header ref={ref} className="fixed top-0 z-50 w-full bg-bg-dark/90 backdrop-blur-md border-b border-neon-cyan/30">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="h-14 flex items-center justify-between">
					{/* Left: Combined Drive Logo + League Dropdown */}
					<div className="relative" ref={dropdownRef}>
						{/* Drive Logo + Name Button (opens dropdown) */}
						<button
							onClick={() => setDropdownOpen(!dropdownOpen)}
							className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
						>
							<img
								src="/logos/Drive-logo.png"
								alt="Drive"
								className="h-8 w-8 rounded-sm"
							/>
							<div className="flex items-center gap-2 leading-tight">
								<span className="text-text-light font-semibold tracking-wide">{leagueConfig.displayName}</span>
								<span className="ml-1 text-xs text-neon-cyan">v0.7</span>
								{league === 'nfl' ? (
									<FaFootballBall className="text-neon-cyan ml-2" />
								) : (
									<FaBasketballBall className="text-orange-500 ml-2" />
								)}
								<FaChevronDown className={`text-xs text-text-muted transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
							</div>
						</button>

						{/* Dropdown Menu */}
						{dropdownOpen && (
							<div className="absolute top-full left-0 mt-2 w-40 bg-bg-darker border border-neon-cyan/30 rounded-lg shadow-xl overflow-hidden z-50">
								{leagues.map((l) => (
									<button
										key={l.id}
										onClick={() => handleLeagueChange(l.id)}
										className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-dark transition-colors ${
											league === l.id ? 'bg-bg-dark/50' : ''
										}`}
									>
										{l.icon}
										<span className="text-text-light font-medium">{l.name}</span>
									</button>
								))}
							</div>
						)}
					</div>

					{/* Right: Auth / Google login */}
					<div className="flex items-center gap-3">
						<GoogleLoginButton />
					</div>
				</div>
			</div>
		</header>
	);
});

export default LoginNav;

