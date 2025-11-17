import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import GuideSection, { featuresData } from "@/components/landing/Features";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import TestimonialCard from "@/components/landing/TestimonialCard";
import TelegramSocialSection from "@/pages/x/Telegram";

const Guide: React.FC = () => {
	const [visibleSections, setVisibleSections] = useState<{ [key: string]: boolean }>({});
	const navigate = useNavigate();
	const { user } = useAuth();
	const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

	// Intersection Observer for section animations
	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						const sectionId = entry.target.id || entry.target.getAttribute('data-section-id');
						if (sectionId) {
							setVisibleSections(prev => ({ ...prev, [sectionId]: true }));
						}
					}
				});
			},
			{ threshold: 0.1, rootMargin: '50px 0px' }
		);

		// Observe all sections and feature elements
		Object.values(sectionRefs.current).forEach(ref => {
			if (ref) observer.observe(ref);
		});

		// Also observe individual feature sections
		const featureSections = document.querySelectorAll('section[id^="bot-"], section[id="analytics"], section[id="leaderboard"]');
		featureSections.forEach(section => observer.observe(section));

		return () => observer.disconnect();
	}, []);

	// Show the full guide content
	return (
		<div className="min-h-screen tracking-wide py-10 text-neon-light">
			<div className="max-w-7xl mx-auto px-4">
				{/* Hero Section */}
				<Hero />

				{/* Getting Started Section */}
				<HowItWorks />

				{/* Robohash Gallery */}
				<div 
					ref={el => sectionRefs.current['robohash-gallery'] = el}
					className={`flex flex-col md:flex-row justify-center items-start gap-8 mb-16 transition-all duration-1000 ${
						visibleSections['robohash-gallery'] 
							? 'opacity-100 translate-y-0 scale-100' 
							: 'opacity-0 translate-y-8 scale-95'
					}`}
					id="robohash-gallery"
				>
					<div className="ml-6 flex flex-col justify-center items-center pointer-events-none">
						<div className="bg-black/80 rounded-xl px-6 py-6 max-w-4xl mx-auto">
							<div className="text-lg font-bold text-neon-cyan drop-shadow-[0_0_8px_#00ffe7] mb-2 text-center">
								Bots with 💞 by Robohash.org
							</div>
							<div className="flex flex-wrap justify-center gap-4 mt-4">
								{[352, 2321, 7, 33, 778, 324, 76].map((num, index) => (
									<img
										key={num}
										src={`https://robohash.org/dextercity-${num}?set=set1&size=100x100`}
										alt={`Robohash bot ${num}`}
										className={`w-24 h-24 rounded-lg border-2 border-neon-cyan shadow-md bg-neon-darker transition-all duration-500 ${
											visibleSections['robohash-gallery'] 
												? 'opacity-100 translate-y-0 rotate-0' 
												: 'opacity-0 translate-y-4 rotate-12'
										}`}
										style={{ transitionDelay: `${index * 100}ms` }}
									/>
								))}
							</div>
						</div>
					</div>
				</div>

				{/* Features Section */}
				<div 
					ref={el => sectionRefs.current['features'] = el}
					className={`bg-[#23263a]/90 border border-[#00ffe7]/30 rounded-xl shadow-lg p-8 mb-12 hover:shadow-[0_0_32px_rgba(0,255,231,0.2)] transition-all duration-1000 ${
						visibleSections['features'] 
							? 'opacity-100 translate-x-0 rotate-0' 
							: 'opacity-0 -translate-x-12 rotate-1'
					}`}
					data-section-id="features"
				>
					<h2 id="features" className={`text-3xl font-bold text-[#00ffe7] mb-8 text-center drop-shadow-[0_0_8px_#00ffe7] transition-all duration-700 ${
						visibleSections['features'] 
							? 'opacity-100 translate-y-0' 
							: 'opacity-0 -translate-y-4'
					}`}>
						⚡ Platform Features
					</h2>
					{featuresData.map((feature, index) => (
						<div
							key={feature.id}
							className={`transition-all duration-700 ${
								visibleSections['features']
									? 'opacity-100 translate-y-0'
									: 'opacity-0 translate-y-8'
							}`}
							style={{ transitionDelay: `${index * 200}ms` }}
							data-feature-id={feature.id}
						>
	
						</div>
					))}
				</div>

				{/* Telegram Social Section */}
				<TelegramSocialSection />

				{/* Testimonial */}
				<div 
					ref={el => sectionRefs.current['testimonial'] = el}
					className={`transition-all duration-1000 ${
						visibleSections['testimonial'] 
							? 'opacity-100 translate-x-0 rotate-0' 
							: 'opacity-0 translate-x-8 -rotate-2'
					}`}
					id="testimonial"
				>
					<TestimonialCard />
				</div>
			</div>
		</div>
	);
};

export default Guide;
