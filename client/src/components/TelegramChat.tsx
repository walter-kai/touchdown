import React, { useEffect, useRef, useState } from 'react';
import { useLoading } from '@/providers/LoadingContext';

interface TelegramChatProps {
  gameId?: string;
  league?: 'nba' | 'nfl';
  awayTeam?: any;
  homeTeam?: any;
}

const TelegramChat: React.FC<TelegramChatProps> = ({ gameId, league = 'nba', awayTeam, homeTeam }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [isFirstComment, setIsFirstComment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showLoading, hideLoading } = useLoading();

  useEffect(() => {
    const loadChatId = async () => {
      if (!gameId) return;

      try {
        // Call backend to get the chat ID
        const response = await fetch('/api/telegram/getChatId', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            gameId,
            league
          })
        });

        if (response.status === 404) {
          // No game data yet - show "Be the first to comment"
          setChatId(null);
          setIsFirstComment(true);
          setError(null);
          return;
        }

        if (!response.ok) {
          setError('Failed to load comments');
          return;
        }

        const data = await response.json();

        if (data.success) {
          // Chat exists, use the chatId
          setChatId(data.chatId);
          setIsFirstComment(false);
          setError(null);
        } else if (data.notFound) {
          // Chat doesn't exist, show "Be the first to comment" message
          setIsFirstComment(true);
          setError(null);
        } else {
          setError(data.error || 'Failed to load comments');
        }
      } catch (err) {
        console.error('Error loading chat ID:', err);
        setError('Failed to load comments');
      }
    };

    loadChatId();
  }, [gameId, league]);

  const handleCreateTopic = async () => {
    if (!gameId) return;

    try {
      showLoading('Creating discussion...');
      
      // Create topic name
      const emoji = league === 'nba' ? '🏀' : '🏈';
      const awayAbbr = awayTeam?.team?.abbreviation || 'AWAY';
      const homeAbbr = homeTeam?.team?.abbreviation || 'HOME';
      const topicName = `${emoji}${league.toUpperCase()}:${awayAbbr}vs${homeAbbr}`;
      
      // Call backend to create a new telegram topic
      const response = await fetch('/api/telegram/createTopic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          gameId,
          league,
          topicName
        })
      });

      const data = await response.json();

      if (data.success) {
        // Topic created successfully, use the returned chatId
        setChatId(data.chatId);
        setIsFirstComment(false);
      } else {
        setError(data.error || 'Failed to create discussion');
      }
    } catch (err) {
      console.error('Error creating topic:', err);
      setError('Failed to create discussion');
    } finally {
      hideLoading();
    }
  };

  useEffect(() => {
    if (!containerRef.current || !chatId) return;

    // Clear any previous content
    containerRef.current.innerHTML = '';

    // Create and append the script to the container
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-discussion', chatId);
    script.setAttribute('data-comments-limit', '10');
    script.setAttribute('data-colorful', '1');
    script.setAttribute('data-color', '00d3c0');
    script.setAttribute('data-dark', '1');
    
    containerRef.current.appendChild(script);
  }, [chatId]);

  if (error) {
    return (
      <div className="w-full p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (isFirstComment) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-8 bg-bg-dark/50 rounded-lg border border-neon-cyan/20">
        <p className="text-text-light mb-4 text-lg">Be the first to comment!</p>
        <button
          onClick={handleCreateTopic}
          className="px-6 py-2 bg-neon-cyan text-bg-darkest rounded-lg font-semibold hover:bg-neon-cyan/80 transition"
        >
          Start Discussion
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div ref={containerRef} className="telegram-widget-container" />
    </div>
  );
};

export default TelegramChat;
