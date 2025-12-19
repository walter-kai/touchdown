import React from "react";
import { FaUsers, FaComments, FaBullhorn, FaRobot, FaTelegramPlane } from "react-icons/fa";

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

const TelegramCard: React.FC = () => (
	<div className="flex flex-col items-center justify-center py-12">
		<div className="flex items-center gap-3 mb-3">
			<FaTelegramPlane className="text-[#0088cc] text-4xl" />
			<h2 className="text-3xl font-bold">Join Our Community</h2>
		</div>
		<p className="text-lg text-gray-400 mb-8 text-center max-w-2xl">
			Connect with other players, get updates, and stay informed through our Telegram channels!
		</p>
		<div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			{telegramCards.map((card) => (
				<div
					key={card.title}
					className={`flex flex-col bg-[#181a23]/50 border ${card.borderColor} rounded-lg p-6 hover:border-opacity-60 transition-all`}
				>
					<div className="flex flex-col items-center mb-4">
						<div className="mb-3">
							{card.icon}
						</div>
						<h3
							className={`text-xl font-bold ${card.titleColor} mb-2 text-center`}
						>
							{card.title}
						</h3>
						<p className="text-gray-400 text-sm mb-4 text-center flex-1">
							{card.desc}
						</p>
					</div>
					<div className="mt-auto w-full">
						<a
							href={card.href}
							target="_blank"
							rel="noopener noreferrer"
							className={`block w-full px-4 py-2 ${card.buttonColor} ${card.buttonTextColor} font-semibold rounded-lg transition text-center text-sm`}
						>
							{card.buttonText}
						</a>
					</div>
				</div>
			))}
		</div>
	</div>
);

export default TelegramCard;
