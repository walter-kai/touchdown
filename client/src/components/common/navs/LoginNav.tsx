import React from 'react';
import { useNavigate } from 'react-router-dom';
import GoogleLoginButton from '../GoogleLoginButton';

const LoginNav = React.forwardRef<HTMLElement>((props, ref) => {
	const navigate = useNavigate();

	return (
		<header ref={ref} className="fixed top-0 z-50 w-full bg-bg-dark/60 backdrop-blur-md border-b border-neon-cyan/30">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="h-14 flex items-center justify-between">
					{/* Left: Drive Logo */}
					<button
						onClick={() => navigate('/')}
						className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
					>
						<img
							src="/logos/Drive-logo.png"
							alt="Drive"
							className="h-8 w-8 rounded-sm"
						/>
						<div className="flex items-center gap-2 leading-tight">
							<span className="text-text-light font-semibold tracking-wide">Touchdown</span>
							<span className="ml-1 text-xs text-neon-cyan">v0.8</span>
						</div>
					</button>

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

