import React, { useEffect, useRef } from 'react';

interface TelegramChatProps {
  gameId?: string;
}

const TelegramChat: React.FC<TelegramChatProps> = ({ gameId }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any previous content
    containerRef.current.innerHTML = '';

    // Create and append the script to the container
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-discussion', 'dexdown/42');
    script.setAttribute('data-comments-limit', '10');
    // script.setAttribute('data-width', '300');
    script.setAttribute('data-colorful', '1');
    script.setAttribute('data-color', '00d3c0');
    script.setAttribute('data-dark', '1');
    
    containerRef.current.appendChild(script);
  }, []);

  return (
    <div className="w-full">
      <div ref={containerRef} className="telegram-widget-container" />
    </div>
  );
};

export default TelegramChat;
