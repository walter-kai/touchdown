import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BotForSale } from '../../../../types/Bot';
import { BotConfig } from '../../../../types/Bot';
import BotDetail from '../../components/shop/BotDetail';
import BuyingTab from '../../components/shop/BuyingTab';
import SellingTab from '../../components/shop/SellingTab';
import PurchaseModal from '../../components/shop/PurchaseModal';
import { FaTimes, FaShoppingCart, FaTag } from 'react-icons/fa';
import { authenticatedFetch } from '../../utils/jwtStorage';

// Helper to generate random bots
const categoriesList = [
	['Crypto', 'Arbitrage', 'AI'],
	['Stocks', 'Swing', 'ML'],
	['Fantasy', 'Sports', 'Automation'],
	['NFT', 'Sniper', 'DeFi'],
	['Options', 'Momentum', 'Quant'],
	['Forex', 'Scalping', 'Trend'],
];

const botNames = [
	'Crypto Bot', 'Stock Bot', 'Fantasy Football Bot', 'NFT Sniper', 'Options Wizard', 'Forex Falcon',
	'Momentum Master', 'Trend Tracker', 'DeFi Defender', 'Arbiter', 'Swing King', 'AI Alpha',
	'Sports Guru', 'SniperX', 'Quantum', 'ScalpPro', 'Yield Farmer', 'Pump Hunter', 'BearBot',
	'BullBot', 'Grid Genius', 'Hedge Hog', 'Flash Trader', 'AutoPilot', 'SmartBot', 'Risk Ranger',
	'Profit Pilot', 'Trade Titan', 'Alpha Wolf', 'Beta Bot', 'Gamma Guru', 'Delta Dealer',
	'Omega Operator', 'Sigma Sniper', 'Theta Thinker', 'Lambda Logic'
];

function getRandomInt(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

const defaultBots: (BotForSale & {
	stats: { 
		trades: number; 
		tradesPerDay: number;
		profitLoss: number;
		avgTradeTime: number;
		age: number;
	};
	categories: string[];
	risk: number;
	buyPrice: number;
	hirePrice: number;
	isPublic: boolean;
})[] = Array.from({ length: 36 }).map((_, i) => {
	const name = botNames[i % botNames.length];
	const categories = categoriesList[i % categoriesList.length];
	const minEth = 0.003;
	const maxEth = 0.006;
	const buyPrice = Math.round((Math.random() * (maxEth - minEth) + minEth) * 1000) / 1000;
	const isPublic = Math.random() > 0.7;
	const totalTrades = getRandomInt(100, 5000);
	const age = getRandomInt(10, 365);
	return {
		id: (i + 1).toString(),
		name,
		description: `This is ${name}, your automated trading assistant for ${categories.join(', ')}.`,
		price: buyPrice,
		buyPrice: buyPrice,
		hirePrice: 0,
		isPublic,
		image: `https://robohash.org/dextercity-${encodeURIComponent(name)}?size=120x120`,
		stats: {
			trades: totalTrades,
			tradesPerDay: Math.round(totalTrades / Math.max(age, 1)),
			profitLoss: parseFloat((Math.random() * 40 - 10).toFixed(1)), // -10% to +30%
			avgTradeTime: getRandomInt(5, 240), // 5 minutes to 4 hours
			age: age,
		},
		categories,
		risk: getRandomInt(1, 5),
	};
});

const allCategories = Array.from(new Set(categoriesList.flat()));

const Shop = () => {
	const { botId } = useParams<{ botId?: string }>();
	const navigate = useNavigate();
	const [activeTab, setActiveTab] = useState<'buying' | 'selling'>('buying');
	const [bots] = useState(defaultBots);
	const [myBots, setMyBots] = useState<BotConfig[]>([]);
	const [myListings, setMyListings] = useState<any[]>([]);
	const [user, setUser] = useState<{ walletId: string } | null>(null);
	const [showPurchaseModal, setShowPurchaseModal] = useState(false);
	const [selectedBotToPurchase, setSelectedBotToPurchase] = useState<any>(null);
	const [purchaseType, setPurchaseType] = useState<'buy' | 'hire'>('buy');

	const selectedBot = bots.find((bot) => bot.id === botId);

	const handleCloseModal = () => navigate('/i/shop');
	const handleOpenModal = (botId: string) => navigate(`/i/shop/${botId}`);
	
	const handleBuyBot = (bot: any) => {
		setSelectedBotToPurchase(bot);
		setPurchaseType('buy');
		setShowPurchaseModal(true);
	};

	const handleHireBot = (bot: any) => {
		setSelectedBotToPurchase(bot);
		setPurchaseType('hire');
		setShowPurchaseModal(true);
	};

	const handlePurchaseConfirm = () => {
		console.log(`${purchaseType}ing bot:`, selectedBotToPurchase);
		alert(`${purchaseType === 'buy' ? 'Purchase' : 'Hire'} successful! (Placeholder)`);
		setShowPurchaseModal(false);
		setSelectedBotToPurchase(null);
	};

	useEffect(() => {
		const storedUser = sessionStorage.getItem('currentUser');
		if (storedUser && storedUser !== 'undefined') {
			const parsedUser = JSON.parse(storedUser);
			setUser(parsedUser);
		}
	}, []);

	useEffect(() => {
		const fetchMyBots = async () => {
			if (!user?.walletId) return;

			try {
				const response = await authenticatedFetch(`/api/bot/mine?walletId=${user.walletId}`);
				if (response.ok) {
					const data = await response.json();
					setMyBots(data);
				}
			} catch (error) {
				console.error('Error fetching my bots:', error);
			}
		};

		fetchMyBots();
	}, [user]);

	const handleSellSubmit = (listingData: any) => {
		const newListing = {
			id: Date.now().toString(),
			...listingData,
			listedDate: new Date().toISOString()
		};
		setMyListings([...myListings, newListing]);
		alert('Bot listed for sale successfully!');
	};

	const handleRemoveListing = (listingId: string) => {
		setMyListings(myListings.filter(listing => listing.id !== listingId));
	};

	return (
		<div className="page-wrapper">
			<div className="page-content">
				<div className="page-scroll">
					<div className="page-inner">
						<div className="w-full max-w-[1600px] mx-auto px-4 py-20 animate-fade-in-up">
							<div className="flex items-center justify-between mb-6">
								<h1 className="text-3xl font-extrabold text-[#00ffe7] drop-shadow-[0_0_8px_#00ffe7] tracking-widest hud-title">
									BOT MARKETPLACE
								</h1>
								{/* Tab Navigation */}
								<div className="gap-2 flex">
									<button
										onClick={() => setActiveTab('buying')}
										className={`px-6 py-3 rounded-lg font-bold border-2 transition-all duration-200 ${
											activeTab === 'buying'
												? 'bg-[#00ffe7] text-[#181a23] border-[#00ffe7] shadow-[0_0_8px_#00ffe7]'
												: 'bg-[#23263a] text-[#e0e7ef] border-[#00ffe7]/40 hover:bg-[#00ffe7]/20'
										}`}
						>
							<FaShoppingCart className="inline mr-2" />
							BUYING
						</button>
						<button
							onClick={() => setActiveTab('selling')}
							className={`px-6 py-3 rounded-lg font-bold border-2 transition-all duration-200 ${
								activeTab === 'selling'
									? 'bg-[#00ffe7] text-[#181a23] border-[#00ffe7] shadow-[0_0_8px_#00ffe7]'
									: 'bg-[#23263a] text-[#e0e7ef] border-[#00ffe7]/40 hover:bg-[#00ffe7]/20'
							}`}
						>
							<FaTag className="inline mr-2" />
							SELLING
						</button>
					</div>
				</div>


				{/* Tab Content */}
				{activeTab === 'buying' ? (
					<BuyingTab
						bots={bots}
						allCategories={allCategories}
						onOpenModal={handleOpenModal}
						onBuyBot={handleBuyBot}
						onHireBot={handleHireBot}
					/>
				) : (
					<SellingTab
						myBots={myBots}
						myListings={myListings}
						onSellSubmit={handleSellSubmit}
						onRemoveListing={handleRemoveListing}
					/>
				)}
			</div>

			{/* Bot Details Modal */}
			{selectedBot && (
				<div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
					<div className="bg-[#23263a] w-full max-w-3xl rounded-2xl p-10 relative border-4 border-[#00ffe7]/40 shadow-[0_0_48px_#00ffe7] hud-panel">
						<button
							onClick={handleCloseModal}
							className="absolute z-10 top-6 right-6 bg-[#181a23] p-3 rounded-full hover:bg-[#00ffe7] hover:text-[#181a23] text-[#00ffe7] shadow-[0_0_8px_#00ffe7] border-2 border-[#00ffe7] transition-all text-2xl"
							aria-label="Close"
						>
							<FaTimes />
						</button>
						<BotDetail bot={selectedBot} />
					</div>
				</div>
			)}

			{/* Purchase Modal */}
			<PurchaseModal
				isOpen={showPurchaseModal}
				onClose={() => {
					setShowPurchaseModal(false);
					setSelectedBotToPurchase(null);
				}}
				bot={selectedBotToPurchase}
				type={purchaseType}
				onConfirm={handlePurchaseConfirm}
			/>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Shop;
