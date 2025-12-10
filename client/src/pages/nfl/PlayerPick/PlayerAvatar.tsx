import React from 'react';
import { FaUsers } from 'react-icons/fa';

interface PlayerAvatarProps {
  headshotUrl?: string;
  displayName: string;
  size?: 'small' | 'medium' | 'large';
  borderColor?: string;
}

const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  headshotUrl,
  displayName,
  size = 'medium',
  borderColor = 'border-[#00ffe7]/50',
}) => {
  const sizeClasses = {
    small: 'w-7 h-6',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
  };

  const iconSizes = {
    small: 'text-xs',
    medium: 'text-xs',
    large: 'text-sm',
  };

  const sizeClass = sizeClasses[size];
  const iconSize = iconSizes[size];

  return (
    <>
      {headshotUrl ? (
        <img
          src={headshotUrl}
          alt={displayName}
          className={`${sizeClass} rounded-full object-cover border-2 ${borderColor} flex-shrink-0`}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
            const fallback = (e.currentTarget as HTMLImageElement).nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
      ) : null}
      <div 
        className={`${sizeClass} rounded-full bg-[#23263a] border-2 ${borderColor} flex items-center justify-center flex-shrink-0`}
        style={{ display: headshotUrl ? 'none' : 'flex' }}
      >
        <FaUsers className={`text-[#00ffe7] ${iconSize}`} />
      </div>
    </>
  );
};

export default PlayerAvatar;
