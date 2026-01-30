'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import GoogleLoginButton from './GoogleLoginButton';

const LoginNavNext = React.forwardRef<HTMLElement>((props, ref) => {
	const router = useRouter();

	return (
		<header ref={ref} className="fixed top-0 z-50 w-full bg-bg-dark/60 backdrop-blur-md border-b border-neon-cyan/30">
			<div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
				<div className="h-14 flex items-center justify-between">
					{/* Left: Drive Logo */}
					<button
						onClick={() => router.push('/')}
						className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
					>
						<img
							src="/logos/Drive-logo.png"
							alt="Drive"
							className="h-8 w-8 rounded-sm"
						/>
						<div className="flex items-center gap-2 leading-tight">
							<h2 className="mb-0">Touchdown</h2>
							<span className="ml-1 text-xs text-neon-cyan">v0.9</span>
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

LoginNavNext.displayName = 'LoginNavNext';

export default LoginNavNext;
