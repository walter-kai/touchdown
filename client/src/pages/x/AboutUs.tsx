import React, { useState } from "react";
import { FaTwitter, FaLinkedin, FaExternalLinkAlt, FaUsers, FaComments, FaBullhorn, FaRobot, FaTelegramPlane, FaEnvelope, FaUser, FaBriefcase, FaComment, FaCheckCircle } from "react-icons/fa";
import StatusPopup from '../../components/common/StatusPopup';
import SliderCaptcha from '../../components/landing/contact/SliderCaptcha';

const experienceTiles = [
	{
		category: "Entertainment & Celebrities",
		companies: ["Lady Gaga", "P!nk", "Jerry Bruckheimer", "Kim Kardashian"],
		icon: "🎭",
		color: "#ff6b9d"
	},
	{
		category: "Tech Giants",
		companies: ["Microsoft", "Hootsuite"],
		icon: "🏢",
		color: "#4fc3f7"
	},
	{
		category: "Blockchain & Gaming",
		companies: ["TRON", "DLive.tv", "Evolution Gaming"],
		icon: "⛓️",
		color: "#9c27b0"
	},
	{
		category: "Healthcare & Engineering",
		companies: ["Eli Lilly", "Arup"],
		icon: "🏥",
		color: "#66bb6a"
	},
	{
		category: "Education",
		companies: ["MBA - NFT Industry Thesis"],
		icon: "🎓",
		color: "#ffa726"
	}
];

const telegramCards = [
  {
    icon: <FaBullhorn className="text-4xl text-[#00ffe7]" />,
    title: "Bulletin Channel",
    desc: "Official news, updates, and announcements.",
    buttonText: "Join Channel",
    href: "https://t.me/+3kbxUgMdGkM2YTY9",
    borderColor: "border-[#00ffe7]/30",
    titleColor: "text-[#00ffe7]",
    buttonColor: "bg-[#00ffe7] hover:bg-[#faafe8]",
    buttonTextColor: "text-[#181a23]",
  },
  {
    icon: <FaComments className="text-4xl text-[#faafe8]" />,
    title: "Group Chat",
    desc: "Meet other users, ask questions, and discuss strategies.",
    buttonText: "Join Group",
    href: "https://t.me/+W1S8xA6ygboyN2Q9",
    borderColor: "border-[#faafe8]/30",
    titleColor: "text-[#faafe8]",
    buttonColor: "bg-[#faafe8] hover:bg-[#00ffe7]",
    buttonTextColor: "text-[#181a23]",
  },
  {
    icon: <FaRobot className="text-4xl text-[#00ffe7]" />,
    title: "@DexterCity_bot",
    desc: "Personal alerts, stats, and settings directly in Telegram.",
    buttonText: "Open Bot",
    href: "https://t.me/DexterCity_bot",
    borderColor: "border-[#00ffe7]/30",
    titleColor: "text-[#00ffe7]",
    buttonColor: "bg-[#00ffe7] hover:bg-[#faafe8]",
    buttonTextColor: "text-[#181a23]",
  },
  {
    icon: <FaUsers className="text-4xl text-[#faafe8]" />,
    title: "Community",
    desc: "Share your bot builds, get help, and participate in events.",
    buttonText: "Get Involved",
    href: "https://t.me/+W1S8xA6ygboyN2Q9",
    borderColor: "border-[#faafe8]/30",
    titleColor: "text-[#faafe8]",
    buttonColor: "bg-[#faafe8] hover:bg-[#00ffe7]",
    buttonTextColor: "text-[#181a23]",
  },
];

interface FormData {
  name: string;
  email: string;
  business: string;
  message: string;
}

const AboutUs: React.FC = () => {
	const [showCaptcha, setShowCaptcha] = useState(false);
	const [captchaVerified, setCaptchaVerified] = useState(false);
	const [showSuccess, setShowSuccess] = useState(false);
	const [showForm, setShowForm] = useState(false);
	const [showStatusFooter, setShowStatusFooter] = useState(false);
	const [statusType, setStatusType] = useState<'loading' | 'success' | 'error'>('loading');
	const [statusMessage, setStatusMessage] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	
	const [formData, setFormData] = useState<FormData>({
		name: '',
		email: '',
		business: '',
		message: ''
	});

	const handleContactClick = () => {
		setShowCaptcha(true);
	};

	const handleCaptchaSuccess = () => {
		setCaptchaVerified(true);
		setShowSuccess(true);
		
		setTimeout(() => {
			setShowForm(true);
		}, 1500);
		
		setTimeout(() => {
			setShowSuccess(false);
		}, 2000);
	};

	const handleCaptchaFail = () => {
		console.log('Captcha failed');
	};

	const handleCaptchaRefresh = () => {
		console.log('Captcha refreshed');
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: value
		}));
	};

	const handleFormSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		
		setIsSubmitting(true);
		setStatusType('loading');
		setStatusMessage('Sending your message...');
		setShowStatusFooter(true);

		try {
			const response = await fetch('/api/telegram/sendMessage', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					name: formData.name,
					email: formData.email,
					business: formData.business,
					message: formData.message
				}),
			});

			const result = await response.json();

			if (result.success) {
				setStatusType('success');
				setStatusMessage('Message sent successfully! We\'ll get back to you soon.');
				setFormData({ name: '', email: '', business: '', message: '' });
				
				setTimeout(() => {
					setShowStatusFooter(false);
					setTimeout(() => {
						setShowForm(false);
						setShowSuccess(false);
						setCaptchaVerified(false);
						setShowCaptcha(false);
						setIsSubmitting(false);
					}, 500);
				}, 3000);
			} else {
				setStatusType('error');
				setStatusMessage('Failed to send message. Please try again.');
				setIsSubmitting(false);
				
				setTimeout(() => {
					setShowStatusFooter(false);
				}, 5000);
			}
		} catch (error) {
			setStatusType('error');
			setStatusMessage('Network error. Please check your connection and try again.');
			setIsSubmitting(false);
			
			setTimeout(() => {
				setShowStatusFooter(false);
			}, 5000);
		}
	};

	return (
		<div className="fixed inset-0 bg-[#23263a]/70 overflow-hidden animate-fade-in-up">
			<div className="relative w-full h-full flex justify-center items-start">
				<div className="w-full h-screen flex justify-center custom-scrollbar" style={{ overflowY: 'auto' }}>
					<div className="max-w-7xl mx-auto px-4 py-28 grid grid-cols-1 md:grid-cols-5 gap-8">
						{/* Profile Card - Centered */}
						<div className="flex justify-center mb-48 col-span-2">
							<div className="bg-[#181a23]/90 rounded-3xl border-2 border-[#00ffe7]/30 shadow-[0_0_32px_#00ffe7]/20 backdrop-blur-md overflow-hidden relative h-fit max-w-md w-full">
								{/* Neon border corners */}
								<span className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-[#00ffe7] rounded-tl-3xl opacity-70 animate-pulse" />
								<span className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-[#00ffe7] rounded-tr-3xl opacity-70 animate-pulse" />
								<span className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-[#00ffe7] rounded-bl-3xl opacity-70 animate-pulse" />
								<span className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-[#00ffe7] rounded-br-3xl opacity-70 animate-pulse" />
								{/* Header Profile Section */}
								<div className="px-4 pt-6 pb-3">
									{/* Profile Picture */}
									<div className="flex justify-center mb-3">
										<div className="relative">
											<img
												src="https://robohash.org/dextercity-walt?set=set1&size=200x200"
												alt="Walt"
												className="w-20 h-20 rounded-full border-4 border-[#00ffe7]/60 shadow-[0_0_16px_#00ffe7aa]"
											/>
											<div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#00ffe7] rounded-full border-2 border-[#181a23]"></div>
										</div>
									</div>

									{/* Profile Info */}
									<div className="text-center mb-3">
										<h1 className="text-xl font-bold text-[#00ffe7] mb-1">Walt</h1>
										<p className="text-[#faafe8] text-xs mb-1">Tech Visionary & DexterCity Founder</p>
										<p className="text-[#e0e7ef] text-xs leading-relaxed">
											Almost 20 years in the tech industry. Building the future of automated trading.
										</p>
									</div>

									{/* Link in Bio */}
									<div className="mb-3">
										<a 
											href="https://dexter.city" 
											className="flex items-center justify-center gap-2 bg-[#00ffe7]/10 border border-[#00ffe7]/30 rounded-xl py-1.5 px-3 text-[#00ffe7] text-xs hover:bg-[#00ffe7]/20 transition-colors"
										>
											<FaExternalLinkAlt className="w-2.5 h-2.5" />
											dexter.city
										</a>
									</div>

									{/* Social Media Icons */}
									<div className="flex justify-center gap-3 mb-4">
										<a 
											href="#" 
											className="w-8 h-8 bg-[#1da1f2]/20 border border-[#1da1f2]/40 rounded-xl flex items-center justify-center hover:bg-[#1da1f2]/30 transition-colors"
										>
											<FaTwitter className="w-4 h-4 text-[#1da1f2]" />
										</a>
										<a 
											href="#" 
											className="w-8 h-8 bg-[#0077b5]/20 border border-[#0077b5]/40 rounded-xl flex items-center justify-center hover:bg-[#0077b5]/30 transition-colors"
										>
											<FaLinkedin className="w-4 h-4 text-[#0077b5]" />
										</a>
									</div>
								</div>

								{/* Experience Grid */}
								<div className="px-4 pb-6">
									<h2 className="text-base font-semibold text-[#00ffe7] mb-3 text-center">Experience Highlights</h2>
									<div className="grid grid-cols-2 gap-2">
										{experienceTiles.map((tile, index) => (
											<div
												key={index}
												className="bg-[#23263a]/80 rounded-xl p-3 border border-[#00ffe7]/20 hover:border-[#00ffe7]/40 transition-colors group"
											>
												<div className="text-center mb-2">
													<span className="text-lg mb-1 block">{tile.icon}</span>
													<h3 className="text-xs font-semibold text-[#00ffe7] mb-1 leading-tight">
														{tile.category}
													</h3>
												</div>
												<div className="space-y-1">
													{tile.companies.map((company, companyIndex) => (
														<div
															key={companyIndex}
															className="text-xs text-[#e0e7ef] bg-[#181a23]/60 rounded-lg px-1.5 py-0.5 text-center"
														>
															{company}
														</div>
													))}
												</div>
											</div>
										))}
									</div>
								</div>
							</div>
						</div>

						{/* Telegram Social Section */}
						<div className="mb-16 col-span-3">
							<h2 className="text-3xl font-bold text-[#00ffe7] mb-8 drop-shadow-[0_0_8px_#00ffe7] tracking-widest text-center flex items-center justify-center gap-3">
								<FaTelegramPlane className="text-[#0088cc] text-4xl" />
								Join Our Community
							</h2>
							<p className="text-lg text-[#faafe8] mb-8 text-center max-w-2xl mx-auto">
								Telegram is the heart of Dexter City's community. Connect, share, and stay updated with our channels, group, and bot!
							</p>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
								{telegramCards.map((card) => (
									<div
										key={card.title}
										className={`relative flex flex-col items-center bg-[#181c23] border-2 ${card.borderColor} rounded-2xl shadow-[0_0_32px_#00ffe7]/20 p-6 passport-card overflow-hidden`}
									>
										<div className="flex flex-col items-center mb-4">
											<div className="h-16 flex items-center justify-center mb-2">
												{card.icon}
											</div>
											<h3 className={`text-xl font-bold ${card.titleColor} mb-2 text-center`}>
												{card.title}
											</h3>
											<p className="text-[#e0e7ef] text-sm text-center mb-4">
												{card.desc}
											</p>
										</div>
										<div className="mt-auto w-full flex justify-center">
											<a
												href={card.href}
												target="_blank"
												rel="noopener noreferrer"
												className={`inline-block w-full px-4 py-2 ${card.buttonColor} ${card.buttonTextColor} font-bold rounded-lg shadow transition text-center text-sm`}
											>
												{card.buttonText}
											</a>
										</div>
										{/* Neon HUD corners */}
										<span className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#00ffe7] rounded-tl-2xl opacity-60 animate-pulse" />
										<span className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#00ffe7] rounded-tr-2xl opacity-60 animate-pulse" />
										<span className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#00ffe7] rounded-bl-2xl opacity-60 animate-pulse" />
										<span className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#00ffe7] rounded-br-2xl opacity-60 animate-pulse" />
									</div>
								))}
							</div>
						{/* Contact Section */}
						<div className="w-full mt-12">
							<h2 className="text-3xl font-bold text-[#faafe8] mb-8 drop-shadow-[0_0_8px_#faafe8] tracking-widest text-center">
								Get In Touch
							</h2>
							<div className="flex justify-center">
								<div className="relative bg-[#23263a] border-2 border-[#00ffe7]/30 rounded-2xl shadow-[0_0_32px_#00ffe7]/20 passport-card overflow-hidden p-8 w-full max-w-2xl">
									{/* Contact form content */}
									{!showCaptcha ? (
										<div className="text-center">
											<p className="text-[#e0e7ef] mb-6 text-lg">
												We'd love to hear from you! Click the button below to get in touch with our team.
											</p>
											<button
												onClick={handleContactClick}
												className="btn-green flex items-center justify-center gap-2 mx-auto px-8 py-4 text-lg font-semibold transform transition-all duration-300 hover:scale-105"
											>
												<FaEnvelope />
												Contact Us
											</button>
										</div>
									) : showSuccess ? (
										<div className="text-center">
											<div className="bg-gradient-to-r from-green-500/20 to-green-500/10 border border-green-500/50 rounded-lg p-8">
												<FaCheckCircle className="text-green-500 text-6xl mx-auto mb-4" />
												<h3 className="text-green-500 text-xl font-bold mb-2">Verification Successful!</h3>
												<p className="text-[#e0e7ef]">Loading contact form...</p>
											</div>
										</div>
									) : showForm ? (
										<form onSubmit={handleFormSubmit} className="space-y-6">
											<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
												<div>
													<div className="relative">
														<FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#00ffe7]/60" />
														<input
															type="text"
															name="name"
															value={formData.name}
															onChange={handleInputChange}
															disabled={isSubmitting}
															className={`w-full pl-10 pr-4 py-3 bg-[#181a23] border border-[#00ffe7]/30 rounded-lg text-[#e0e7ef] focus:outline-none focus:border-[#00ffe7] focus:ring-1 focus:ring-[#00ffe7] ${
																isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
															}`}
															placeholder="Your name"
															required
														/>
													</div>
												</div>
												<div>
													<div className="relative">
														<FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#00ffe7]/60" />
														<input
															type="email"
															name="email"
															value={formData.email}
															onChange={handleInputChange}
															disabled={isSubmitting}
															className={`w-full pl-10 pr-4 py-3 bg-[#181a23] border border-[#00ffe7]/30 rounded-lg text-[#e0e7ef] focus:outline-none focus:border-[#00ffe7] focus:ring-1 focus:ring-[#00ffe7] ${
																isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
															}`}
															placeholder="Your email"
															required
														/>
													</div>
												</div>
											</div>
											<div>
												<div className="relative">
													<FaBriefcase className="absolute left-3 top-4 text-[#00ffe7]/60" />
													<input
														type="text"
														name="business"
														value={formData.business}
														onChange={handleInputChange}
														disabled={isSubmitting}
														className={`w-full pl-10 pr-4 py-3 bg-[#181a23] border border-[#00ffe7]/30 rounded-lg text-[#e0e7ef] focus:outline-none focus:border-[#00ffe7] focus:ring-1 focus:ring-[#00ffe7] ${
															isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
														}`}
														placeholder="Your company or organization (optional)"
													/>
												</div>
											</div>
											<div>
												<div className="relative">
													<FaComment className="absolute left-3 top-4 text-[#00ffe7]/60" />
													<textarea
														name="message"
														value={formData.message}
														onChange={handleInputChange}
														disabled={isSubmitting}
														rows={6}
														className={`w-full pl-10 pr-4 py-3 bg-[#181a23] border border-[#00ffe7]/30 rounded-lg text-[#e0e7ef] focus:outline-none focus:border-[#00ffe7] focus:ring-1 focus:ring-[#00ffe7] resize-vertical ${
															isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
														}`}
														placeholder="Tell us about your project, questions, or how we can help you..."
														required
													/>
												</div>
											</div>
											<div className="text-center">
												<button
													type="submit"
													disabled={isSubmitting}
													className={`btn-green px-8 py-3 text-lg font-semibold transform transition-all duration-300 ${
														isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
													}`}
												>
													{isSubmitting ? 'Sending...' : 'Send Message'}
												</button>
											</div>
										</form>
									) : (
										<div>
											<h3 className="text-xl font-bold text-[#00ffe7] mb-4 text-center">Please complete the verification</h3>
											<SliderCaptcha
												onSuccess={handleCaptchaSuccess}
												onFail={handleCaptchaFail}
												onRefresh={handleCaptchaRefresh}
											/>
										</div>
									)}
									{/* Neon HUD corners */}
									<span className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#00ffe7] rounded-tl-2xl opacity-60 animate-pulse" />
									<span className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#00ffe7] rounded-tr-2xl opacity-60 animate-pulse" />
									<span className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#00ffe7] rounded-bl-2xl opacity-60 animate-pulse" />
									<span className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#00ffe7] rounded-br-2xl opacity-60 animate-pulse" />
								</div>
							</div>
						</div>
						</div>


						{showStatusFooter && (
							<StatusPopup
								type={statusType}
								message={statusMessage}
								onClose={() => setShowStatusFooter(false)}
							/>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default AboutUs;
