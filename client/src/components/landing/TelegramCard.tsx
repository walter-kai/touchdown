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
	<div className="flex flex-col items-center justify-center px-4 py-16 bg-black/50">
		<h1 className="text-5xl font-bold text-[#00ffe7] mb-8 text-center drop-shadow-[0_0_16px_#00ffe7] flex items-center justify-center gap-3">
			<FaTelegramPlane className="text-[#0088cc] text-5xl" />
			Dexter City on Telegram
		</h1>
		<p className="text-xl text-[#faafe8] mb-12 text-center max-w-2xl">
			Telegram is the heart of Dexter City's community. Connect, share, and stay
			updated with our channels, group, and bot!
		</p>
		<div className="max-w-7xl w-full flex flex-col lg:flex-row gap-10">
			{telegramCards.map((card) => (
				<div
					key={card.title}
					className={`flex-1 flex flex-col items-center bg-[#181c23] border-2 ${card.borderColor} rounded-2xl shadow-[0_0_24px_#00ffe7]/20 p-8 hover:scale-[1.02] transition-transform min-w-[220px]`}
				>
					<div className="flex flex-col items-center mb-2">
						<div className="h-20 flex items-center justify-center">
							{card.icon}
						</div>
					</div>
					<div className="flex-1 flex flex-col w-full">
						<h2
							className={`text-2xl font-bold ${card.titleColor} mb-2 text-center`}
						>
							{card.title}
						</h2>
						<div className="text-[#e0e7ef] mb-4 text-center">
							{card.desc}
						</div>
						<div className="mt-auto w-full flex justify-center">
							<a
								href={card.href}
								target="_blank"
								rel="noopener noreferrer"
								className={`inline-block w-full px-5 py-2 ${card.buttonColor} ${card.buttonTextColor} font-bold rounded-lg shadow hover:bg-[#faafe8] hover:text-[#181a23] transition text-center`}
							>
								{card.buttonText}
							</a>
						</div>
					</div>
				</div>
			))}
		</div>
	</div>
);

export default TelegramCard;
