import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BotConfig } from '../../../../types/Bot';
import { Chart, LineElement, PointElement, LinearScale, CategoryScale, ArcElement, Tooltip, Legend } from 'chart.js';
import StatusPopup from '../../components/common/StatusPopup';
import BotCard from '../../components/garage/BotCard';
import CreateBotCard from '../../components/garage/CreateBotCard';
import BotDetails from '../../components/garage/BotDetails';
import DeleteModal from '../../components/garage/DeleteModal';
import EmptyState from '../../components/garage/EmptyState';
import { authenticatedFetch } from '../../utils/jwtStorage';

Chart.register(LineElement, PointElement, LinearScale, CategoryScale, ArcElement, Tooltip, Legend);

const Garage = () => {
  const navigate = useNavigate();

  const [bots, setBots] = useState<BotConfig[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [user, setUser] = useState<{ walletId: string } | null>(null);
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
  const [botToDelete, setBotToDelete] = useState<string | null>(null);
  const [statusFooter, setStatusFooter] = useState<{ type: 'success' | 'error' | 'loading', message: string } | null>(null);

  const selectedBot = bots.find((bot) => bot.botName === selectedBotId);

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

      setLoading(true);

      try {
        const response = await authenticatedFetch(`/api/bot/mine?walletId=${user.walletId}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch bots: ${response.statusText}`);
        }

        const data = await response.json();
        setBots(data);
      } catch (error) {
        console.error('Error fetching bots:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyBots();
  }, [user]);

  const handleCloneBot = (botId: string) => {
    const selectedBot = bots.find((bot) => bot.botName === botId);
    if (selectedBot) {
      const editBot = {
        ...selectedBot,
        botName: 'Clone of ' + selectedBot.botName
      }
      navigate('/build', { state: { botConfig: editBot } });
    }
  };

  const handleTriggerBuildModal = () => {
    navigate('/build');
  };

  const handleDeleteModalOpen = (botName: string) => {
    setBotToDelete(botName);
  };

  const handleDeleteModalClose = () => {
    setBotToDelete(null);
  };

  const handleDeleteBot = async () => {
    if (!botToDelete) return;

    try {
      const response = await authenticatedFetch(`/api/bot?botName=${botToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete bot: ${response.statusText}`);
      }

      setBots(bots.filter((bot) => bot.botName !== botToDelete));
      handleDeleteModalClose();
    } catch (error) {
      console.error('Error deleting bot:', error);
      setStatusFooter({ type: 'error', message: 'Failed to delete the bot. Please try again later.' });
    }
  };

  const handleStartBot = async (botName: string) => {
    try {
      const response = await authenticatedFetch(`/api/bot/start?botName=${botName}`, {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error(`Failed to start bot: ${response.statusText}`);
      }

      setBots((prevBots) =>
        prevBots.map((bot) =>
          bot.botName === botName ? { ...bot, status: 'Running' } : bot
        )
      );
    } catch (error) {
      console.error('Error starting bot:', error);
      setStatusFooter({ type: 'error', message: 'Failed to start the bot. Please try again later.' });
    }
  };

  const handleStopBot = async (botName: string) => {
    try {
      const response = await authenticatedFetch(`/api/bot/stop?botName=${botName}`, {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error(`Failed to stop bot: ${response.statusText}`);
      }

      setBots((prevBots) =>
        prevBots.map((bot) =>
          bot.botName === botName ? { ...bot, status: 'Stopped' } : bot
        )
      );
    } catch (error) {
      console.error('Error stopping bot:', error);
      setStatusFooter({ type: 'error', message: 'Failed to stop the bot. Please try again later.' });
    }
  };

  const handleCopyWallet = (wallet: string) => {
    if (!wallet) return;
    navigator.clipboard.writeText(wallet);
    setStatusFooter({ type: 'success', message: 'Wallet address copied!' });
    setTimeout(() => setStatusFooter(null), 1500);
  };

  return (
    <div className="page-wrapper">
      <div className="page-content">
        <div className="page-scroll">
          <div className="page-inner">
            <div className="w-full px-4 py-24 mx-auto animate-fade-in-up">
              {/* Header - More compact */}
              <div className="w-full max-w-[1600px] mx-auto px-4 mb-3">
                <div className="flex items-center justify-between">
                  <h1 className="text-4xl font-extrabold text-[#00ffe7] drop-shadow-[0_0_16px_#00ffe7] tracking-widest hud-title">
                    BOT GARAGE
                  </h1>
                  <div className="hud-bar bg-[#00ffe7]/30 border-2 border-[#00ffe7] rounded-lg px-4 py-1 shadow-[0_0_24px_#00ffe7] text-[#181a23] font-bold text-base uppercase tracking-wider">
                    <span className="text-[#00ffe7]">BOTS:</span> <span className="text-green-400"> {bots.length}</span>
                  </div>
                </div>
              </div>

      <div className="w-full max-w-[1600px] mx-auto px-4 space-y-3">
        {/* Top Section - Bot Details (when selected) */}
        {selectedBot && (
          <div className="w-full">
            <BotDetails 
              key={selectedBot.botName} 
              bot={selectedBot} 
              onCopyWallet={handleCopyWallet} 
            />
          </div>
        )}

        {/* Bottom Section - Bot Gallery */}
        <div className="w-full">
          {loading && <p className="text-center text-[#00ffe7]">Loading your bots...</p>}
          
          {!loading && bots.length === 0 && (
            <EmptyState isSelected={false} onCreateBot={handleTriggerBuildModal} />
          )}
          
          {!selectedBot && bots.length > 0 && (
            <div className="text-center">
              <EmptyState isSelected={true} onCreateBot={handleTriggerBuildModal} />
            </div>
          )}
          
          {!loading && bots.length > 0 && (
            <div className="mt-8 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-3">
              <CreateBotCard onClick={handleTriggerBuildModal} />
              {bots.map((bot) => (
                <BotCard
                  key={bot.botName}
                  bot={bot}
                  isSelected={selectedBotId === bot.botName}
                  onSelect={setSelectedBotId}
                  onStart={handleStartBot}
                  onStop={handleStopBot}
                  onClone={handleCloneBot}
                  onDelete={handleDeleteModalOpen}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      {botToDelete && (
        <DeleteModal
          botName={botToDelete}
          onConfirm={handleDeleteBot}
          onCancel={handleDeleteModalClose}
        />
      )}

      {statusFooter && (
        <StatusPopup
          type={statusFooter.type}
          message={statusFooter.message}
          onClose={() => setStatusFooter(null)}
        />
      )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Garage;
