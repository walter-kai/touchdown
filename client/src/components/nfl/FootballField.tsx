import React from 'react';
import { FaFootballBall } from 'react-icons/fa';
import { Play, PlayType } from '@/types/espn/playByplay';
import '@/styles/football.css';

interface FootballFieldProps {
  homeTeam: any;
  awayTeam: any;
  lastPlay?: {
    start?: { yardLine: number };
    end?: { yardLine: number };
    type?: {
      id: string;
      text: string;
      abbreviation?: string;
    };
    athletesInvolved?: Array<{
      displayName: string;
      headshot: string;
      position: string;
    }>;
  };
  situation?: {
    downDistanceText?: string;
    possession?: string;
    awayTimeouts?: number;
    homeTimeouts?: number;
  };
  playLog?: Play[];
  getTeamLogo: (team: any) => string;
  showGameInfo?: boolean;
}

// Play visualization config
const getPlayVisualization = (playType?: PlayType | string | { text: string }) => {
  // Handle both string and object types - ensure we always have a string
  let typeStr = '';
  if (typeof playType === 'string') {
    typeStr = playType;
  } else if (playType && typeof playType === 'object' && 'text' in playType) {
    typeStr = playType.text || '';
  }
  // Force to string and lowercase
  const type = String(typeStr || '').toLowerCase();
  
  // Touchdowns - Gold/Yellow
  if (type.includes('touchdown')) {
    return {
      color: '#FFD700',
      glowColor: 'rgba(255, 215, 0, 0.6)',
      icon: '🏆',
      pattern: 'dashed',
      width: 4,
      animate: 'pulse'
    };
  }
  
  // Interceptions - Red
  if (type.includes('interception')) {
    return {
      color: '#FF3333',
      glowColor: 'rgba(255, 51, 51, 0.6)',
      icon: '🔴',
      pattern: 'solid',
      width: 3,
      animate: 'flash'
    };
  }
  
  // Fumbles - Orange
  if (type.includes('fumble')) {
    return {
      color: '#FF8800',
      glowColor: 'rgba(255, 136, 0, 0.6)',
      icon: '⚠️',
      pattern: 'solid',
      width: 3,
      animate: 'shake'
    };
  }
  
  // Sacks - Dark Red with X overlay
  if (type.includes('sack')) {
    return {
      color: '#CC0000',
      glowColor: 'rgba(204, 0, 0, 0.6)',
      icon: '💥',
      pattern: 'solid',
      width: 3,
      animate: 'sack'
    };
  }
  
  // Field Goals - Green/Purple with trajectory
  if (type.includes('field goal')) {
    const isGood = type.includes('good');
    return {
      color: isGood ? '#00FF00' : '#9333EA',
      glowColor: isGood ? 'rgba(0, 255, 0, 0.6)' : 'rgba(147, 51, 234, 0.6)',
      icon: isGood ? '✅' : '❌',
      pattern: 'dotted',
      width: 3,
      animate: 'field-goal'
    };
  }
  
  // Penalties - Yellow flag with greyscale
  if (type.includes('penalty')) {
    return {
      color: '#FFFF00',
      glowColor: 'rgba(255, 255, 0, 0.6)',
      icon: '�🏻‍♂️',
      pattern: 'dashed',
      width: 2,
      animate: 'penalty'
    };
  }
  
  // Pass plays - Cyan with football arc
  if (type.includes('pass')) {
    const isComplete = type.includes('reception');
    return {
      color: isComplete ? '#00FFE7' : '#666666',
      glowColor: isComplete ? 'rgba(0, 255, 231, 0.6)' : 'rgba(102, 102, 102, 0.4)',
      icon: isComplete ? '📨' : '📭',
      pattern: 'solid',
      width: 2,
      animate: isComplete ? 'pass-complete' : 'pass-incomplete'
    };
  }
  
  // Rush plays - Pink/Purple with slide animation
  if (type.includes('rush')) {
    return {
      color: '#FAAFE8',
      glowColor: 'rgba(250, 175, 232, 0.6)',
      icon: '🏃',
      pattern: 'solid',
      width: 2,
      animate: 'rush'
    };
  }
  
  // Punt - Light Blue with high arc, red if out of bounds
  if (type.includes('punt')) {
    const isFail = type.includes('out of bounds') || type.includes('penalty');
    return {
      color: isFail ? '#FF3333' : '#87CEEB',
      glowColor: isFail ? 'rgba(255, 51, 51, 0.6)' : 'rgba(135, 206, 235, 0.6)',
      icon: isFail ? '🚫' : '🦶',
      pattern: 'dotted',
      width: 2,
      animate: isFail ? 'kickoff-fail' : 'punt'
    };
  }
  
  // Kickoff - Blue with arc, red if out of bounds/touchback fail
  if (type.includes('kickoff')) {
    const isFail = type.includes('out of bounds') || type.includes('penalty') || type.includes('touchback');
    return {
      color: isFail ? '#FF3333' : '#4169E1',
      glowColor: isFail ? 'rgba(255, 51, 51, 0.6)' : 'rgba(65, 105, 225, 0.6)',
      icon: isFail ? '🚫' : '⚡',
      pattern: 'dotted',
      width: 2,
      animate: isFail ? 'kickoff-fail' : 'kickoff'
    };
  }
  
  // Timeout - Spinning clock
  if (type.includes('timeout')) {
    return {
      color: '#FFD700',
      glowColor: 'rgba(255, 215, 0, 0.6)',
      icon: '🕐',
      pattern: 'solid',
      width: 2,
      animate: 'timeout'
    };
  }
  
  // Two Minute Warning - Pulsing alarm
  if (type.includes('two-minute warning') || type.includes('two minute warning')) {
    return {
      color: '#FF4500',
      glowColor: 'rgba(255, 69, 0, 0.8)',
      icon: '⚠️',
      pattern: 'solid',
      width: 2,
      animate: 'two-minute-warning'
    };
  }
  
  // End of Regulation - Pulsing end symbol
  if (type.includes('end of') && (type.includes('quarter') || type.includes('half') || type.includes('regulation') || type.includes('game'))) {
    return {
      color: '#FF6B6B',
      glowColor: 'rgba(255, 107, 107, 0.8)',
      icon: '🔚',
      pattern: 'solid',
      width: 2,
      animate: 'end-regulation'
    };
  }
  
  // Default - Cyan
  return {
    color: '#00FFE7',
    glowColor: 'rgba(0, 255, 231, 0.6)',
    icon: '⬇️',
    pattern: 'solid',
    width: 2,
    animate: 'none'
  };
};

const FootballField: React.FC<FootballFieldProps> = ({
  homeTeam,
  awayTeam,
  lastPlay,
  situation,
  playLog = [],
  getTeamLogo,
  showGameInfo = false,
}) => {
  if (!lastPlay) return null;

  // Match the box score layout: away team on left, home team on right
  const leftTeam = awayTeam;
  const rightTeam = homeTeam;
  
  // Get visualization config for this play type - handle both string and object
  const playViz = getPlayVisualization(lastPlay.type);

  return (
    <div className="space-y-6">
      {/* Current Drive Info - Only show if showGameInfo is true */}
      {showGameInfo && situation && (
        <div className="flex items-center justify-between gap-4 mb-4">
          {/* Down & Distance */}
          {situation.downDistanceText && (
            <div className="flex-1 text-center">
              <p className="text-[#b0b7bf] text-xs mb-2">Down & Distance</p>
              <p className="text-[#faafe8] font-bold text-xl">{situation.downDistanceText}</p>
            </div>
          )}
          
          {/* Possession */}
          <div className="flex-1 text-center">
            <p className="text-[#b0b7bf] text-xs mb-2">Possession</p>
            <div className="flex items-center justify-center gap-2">
              <img
                src={situation.possession === homeTeam?.id ? getTeamLogo(homeTeam?.team) : getTeamLogo(awayTeam?.team)}
                alt="Possession"
                className="w-10 h-10"
              />
              <p className="text-[#00ffe7] font-bold text-xl">
                {situation.possession === homeTeam?.id ? homeTeam?.team.abbreviation : awayTeam?.team.abbreviation}
              </p>
            </div>
          </div>
        </div>
      )}

            {/* Timeouts - Only show if showGameInfo is true */}
      {/* {showGameInfo && situation && ( */}
        <div className="flex justify-between items-center pt-4">
          <div className="text-center">
            <p className="text-[#b0b7bf] text-xs mb-1">{awayTeam?.team.abbreviation} Timeouts</p>
            <div className="flex gap-1 justify-center">
              {[...Array(3)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-3 h-3 rounded-full ${
                    i < (situation?.awayTimeouts ?? 3) 
                      ? 'bg-[#00ffe7]' 
                      : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
          
          {/* Play Type Display */}
          {lastPlay?.type?.text && (
            <div className="flex-1 text-center">
              <p className="text-[#b0b7bf] text-xs mb-1">Play Type</p>
              <p className="font-bold text-sm" style={{ color: playViz.color }}>
                {lastPlay.type.text}
              </p>
            </div>
          )}
          
          <div className="text-center">
            <p className="text-[#b0b7bf] text-xs mb-1">{homeTeam?.team.abbreviation} Timeouts</p>
            <div className="flex gap-1 justify-center">
              {[...Array(3)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-3 h-3 rounded-full ${
                    i < (situation?.homeTimeouts ?? 3) 
                      ? 'bg-[#faafe8]' 
                      : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      {/* )} */}

      {/* Football Field */}
      <div className={showGameInfo ? "border-t border-[#00ffe7]/10 pt-6" : ""}>
    <div className="relative w-full bg-gradient-to-b from-green-700 to-green-800 rounded-lg" style={{ height: '200px' }}>
      {/* End zones - 10% each */}
      <div className="absolute left-0 top-0 bottom-0 w-[10%] bg-blue-900/40 flex items-center justify-center">
        <img src={getTeamLogo(leftTeam?.team)} alt="" className="w-12 h-12 opacity-60" />
      </div>
      <div className="absolute right-0 top-0 bottom-0 w-[10%] bg-red-900/40 flex items-center justify-center">
        <img src={getTeamLogo(rightTeam?.team)} alt="" className="w-12 h-12 opacity-60" />
      </div>

      {/* Playing field - 80% between end zones */}
      {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((fieldPercent) => {
        const actualPosition = 10 + (fieldPercent * 0.8);
        const yardNumber = fieldPercent <= 50 ? fieldPercent : 100 - fieldPercent;
        
        return (
          <div
            key={fieldPercent}
            className="absolute top-0 bottom-0 border-l border-white/20"
            style={{ left: `${actualPosition}%` }}
          >
            {fieldPercent % 10 === 0 && (
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-white/40 text-xs font-bold">
                {yardNumber}
              </div>
            )}
          </div>
        );
      })}

      {/* 50 yard line highlight */}
      <div className="absolute top-0 bottom-0 left-[50%] w-0.5 bg-yellow-400/30" />

      {/* Start position dot - positioned at 50% vertical (center) */}
      {lastPlay.start && (
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2"
          style={{ 
            left: `${10 + (lastPlay.start.yardLine * 0.8)}%`,
            top: '60%'
          }}
        >
          <div 
            className="w-3 h-3 rounded-full border-2 border-white shadow-lg"
            style={{ 
              backgroundColor: playViz.color,
              boxShadow: `0 0 10px ${playViz.glowColor}`
            }}
          />
        </div>
      )}

      {/* Arrow showing play direction - positioned at 50% (middle) */}
      {lastPlay.start && lastPlay.end && lastPlay.start.yardLine !== lastPlay.end.yardLine && (
        <>
          <svg
            className={`absolute -left-2 w-full h-full pointer-events-none -top-9 ${
              playViz.animate === 'pulse' ? 'animate-pulse' : ''
            }`}
          >
            <defs>
              <marker
                id={`arrowhead-${playViz.color.replace('#', '')}`}
                markerWidth="10"
                markerHeight="10"
                refX="8"
                refY="4"
                orient="auto"
              >
                <polygon points="0 0, 8 4, 0 8" fill={playViz.color} />
              </marker>
              
              {/* Glow filter for special plays */}
              {(playViz.animate === 'pulse' || playViz.animate === 'flash') && (
                <filter id={`glow-${playViz.color.replace('#', '')}`}>
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              )}
            </defs>
            
            <line
              x1={`${10 + (lastPlay.start.yardLine * 0.8)}%`}
              y1="50%"
              x2={`${10 + (lastPlay.end.yardLine * 0.8)}%`}
              y2="50%"
              stroke={playViz.color}
              strokeWidth={playViz.width}
              strokeDasharray={playViz.pattern === 'dashed' ? '8,4' : playViz.pattern === 'dotted' ? '2,4' : 'none'}
              markerEnd={`url(#arrowhead-${playViz.color.replace('#', '')})`}
              opacity="0.95"
              filter={playViz.animate === 'pulse' || playViz.animate === 'flash' ? `url(#glow-${playViz.color.replace('#', '')})` : 'none'}
            />
            
            {/* Arc path for punts/kickoffs */}
            {playViz.animate === 'arc' && (
              <path
                d={`M ${10 + (lastPlay.start.yardLine * 0.8)}%,50% Q ${10 + ((lastPlay.start.yardLine + lastPlay.end.yardLine) / 2 * 0.8)}%,30% ${10 + (lastPlay.end.yardLine * 0.8)}%,50%`}
                stroke={playViz.color}
                strokeWidth={playViz.width}
                fill="none"
                opacity="0.5"
                strokeDasharray="4,2"
              />
            )}
          </svg>
          
          {/* Play type icon at midpoint - only show for fail cases */}
          {playViz.icon === '🚫' && (
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 text-2xl z-20"
              style={{
                left: `${10 + ((lastPlay.start.yardLine + lastPlay.end.yardLine) / 2 * 0.8)}%`,
                top: '60%',
                filter: `drop-shadow(0 0 8px ${playViz.glowColor})`
              }}
            >
              {playViz.icon}
            </div>
          )}
        </>
      )}

      {/* Timeout - spinning clock emoji (doesn't need play positions) */}
      {playViz.animate === 'timeout' && (
        <div
          className="absolute z-20 animate-timeout-spin"
          style={{ 
            left: '50%',
            top: '60%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div 
            className="text-6xl"
            style={{
              filter: `drop-shadow(0 0 20px ${playViz.glowColor})`
            }}
          >
            {playViz.icon}
          </div>
        </div>
      )}

      {/* Two Minute Warning - pulsing alarm at center (doesn't need play positions) */}
      {playViz.animate === 'two-minute-warning' && (
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 animate-two-minute-warning"
          style={{ 
            left: `${50}%`,
            top: '60%'
          }}
        >
          <div 
            className="flex flex-col items-center gap-2"
            style={{
              filter: `drop-shadow(0 0 30px ${playViz.glowColor})`
            }}
          >
            <div className="text-7xl">{playViz.icon}</div>
            <div 
              className="text-xl font-bold whitespace-nowrap"
              style={{ color: playViz.color }}
            >
              2:00
            </div>
          </div>
        </div>
      )}

      {/* End of Regulation - pulsing at center */}
      {playViz.animate === 'end-regulation' && (
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 animate-end-regulation"
          style={{ 
            left: `${50}%`,
            top: '60%'
          }}
        >
          <div 
            className="flex flex-col items-center gap-2"
            style={{
              filter: `drop-shadow(0 0 30px ${playViz.glowColor})`
            }}
          >
            <div className="text-8xl">{playViz.icon}</div>
            <div 
              className="text-2xl font-bold whitespace-nowrap"
              style={{ color: playViz.color }}
            >
              END
            </div>
          </div>
        </div>
      )}

      {/* Animated play elements */}
      {lastPlay.start && lastPlay.end && lastPlay.athletesInvolved && lastPlay.athletesInvolved.length > 0 && (() => {
        const startX = 10 + (lastPlay.start.yardLine * 0.8);
        const endX = 10 + (lastPlay.end.yardLine * 0.8);
        const distance = endX - startX;
        
        // Rush animation - headshot slides
        if (playViz.animate === 'rush') {
          return (
            <div
              className="absolute z-10 animate-rush-slide"
              style={{ 
                left: `${startX}%`,
                top: '60%',
                '--distance': distance
              } as React.CSSProperties}
            >
              <div className="relative group">
                <div 
                  className="w-20 h-16 rounded-full flex items-center justify-center shadow-2xl"
                  style={{
                    backgroundColor: `${playViz.color}30`,
                    boxShadow: `0 0 20px ${playViz.glowColor}`
                  }}
                >
                  <img
                    src={lastPlay.athletesInvolved[0].headshot}
                    alt={lastPlay.athletesInvolved[0].displayName}
                    className="w-14 h-14 rounded-full object-cover z-1 border-2"
                    style={{ borderColor: playViz.color }}
                  />
                </div>
              </div>
            </div>
          );
        }
        
        // Pass animations - football spins with headshot following
        if (playViz.animate === 'pass-complete' || playViz.animate === 'pass-incomplete') {
          return (
            <>
              {/* Football animation */}
              <div
                className={`absolute z-20 ${playViz.animate === 'pass-complete' ? 'animate-pass-arc' : 'animate-pass-incomplete'}`}
                style={{ 
                  left: `${startX}%`,
                  top: '60%',
                  '--distance': `${distance}%`
                } as React.CSSProperties}
              >
                <img
                  src="/assets/football_spin.gif"
                  alt="Football"
                  className="w-8 h-8 object-contain"
                  style={{
                    filter: `drop-shadow(0 0 10px ${playViz.glowColor})`
                  }}
                />
              </div>
              
              {/* Headshot follows */}
              <div
                className="absolute z-10 animate-headshot-follow"
                style={{ 
                  left: `${startX}%`,
                  top: '60%',
                  '--distance': distance
                } as React.CSSProperties}
              >
                <div className="relative group">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl"
                    style={{
                      backgroundColor: `${playViz.color}30`,
                      boxShadow: `0 0 20px ${playViz.glowColor}`
                    }}
                  >
                    <img
                      src={lastPlay.athletesInvolved[0].headshot}
                      alt={lastPlay.athletesInvolved[0].displayName}
                      className="w-12 h-12 rounded-full object-cover z-1 border-2"
                      style={{ borderColor: playViz.color }}
                    />
                  </div>
                </div>
              </div>
            </>
          );
        }
        
        // Punt/Kickoff - high arc trajectory with football and headshot at end
        if (playViz.animate === 'punt' || playViz.animate === 'kickoff' || playViz.animate === 'kickoff-fail') {
          const animationClass = playViz.animate === 'kickoff-fail' ? 'animate-kickoff-fail' : 'animate-punt-trajectory';
          
          return (
            <>
              {/* Football arc */}
              <div
                className={`absolute z-20 ${animationClass}`}
                style={{ 
                  left: `${startX}%`,
                  top: '60%',
                  '--distance': `${distance}%`
                } as React.CSSProperties}
              >
                <img
                  src="/assets/football_spin.gif"
                  alt="Football"
                  className="w-10 h-10 object-contain"
                  style={{
                    filter: `drop-shadow(0 0 15px ${playViz.glowColor})`
                  }}
                />
              </div>
              
              {/* Headshot at end position - only show for successful kicks */}
              {playViz.animate !== 'kickoff-fail' && lastPlay.athletesInvolved && lastPlay.athletesInvolved[0] && (
                <div
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                  style={{ 
                    left: `${endX}%`,
                    top: '60%'
                  }}
                >
                  <div className="relative group">
                    <div 
                      className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl"
                      style={{
                        backgroundColor: `${playViz.color}30`,
                        boxShadow: `0 0 20px ${playViz.glowColor}`
                      }}
                    >
                      <img
                        src={lastPlay.athletesInvolved[0].headshot}
                        alt={lastPlay.athletesInvolved[0].displayName}
                        className="w-12 h-12 rounded-full object-cover z-1 border-2"
                        style={{ borderColor: playViz.color }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          );
        }
        
        // Field Goal - arc trajectory with headshot at end
        if (playViz.animate === 'field-goal') {
          return (
            <>
              {/* Football arc */}
              <div
                className="absolute z-20 animate-field-goal-arc"
                style={{ 
                  left: `${startX}%`,
                  top: '60%',
                  '--distance': `${distance}%`
                } as React.CSSProperties}
              >
                <img
                  src="/assets/football_spin.gif"
                  alt="Football"
                  className="w-8 h-8 object-contain"
                  style={{
                    filter: `drop-shadow(0 0 10px ${playViz.glowColor})`
                  }}
                />
              </div>
              
              {/* Headshot at end position */}
              <div
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                style={{ 
                  left: `${endX}%`,
                  top: '60%'
                }}
              >
                <div className="relative group">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl"
                    style={{
                      backgroundColor: `${playViz.color}30`,
                      boxShadow: `0 0 20px ${playViz.glowColor}`
                    }}
                  >
                    <img
                      src={lastPlay.athletesInvolved[0].headshot}
                      alt={lastPlay.athletesInvolved[0].displayName}
                      className="w-12 h-12 rounded-full object-cover z-1 border-2"
                      style={{ borderColor: playViz.color }}
                    />
                  </div>
                </div>
              </div>
            </>
          );
        }
        
        // Penalty - greyscale headshot at end with gesture emojis
        if (playViz.animate === 'penalty') {
          return (
            <>
              <div
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                style={{ 
                  left: `${endX}%`,
                  top: '60%'
                }}
              >
                <div className="relative group">
                  <div 
                    className="w-20 h-16 rounded-full flex items-center justify-center shadow-2xl"
                    style={{
                      backgroundColor: `${playViz.color}30`,
                      boxShadow: `0 0 20px ${playViz.glowColor}`
                    }}
                  >
                    <img
                      src={lastPlay.athletesInvolved[0].headshot}
                      alt={lastPlay.athletesInvolved[0].displayName}
                      className="w-14 h-14 rounded-full object-cover z-1 border-2"
                      style={{ 
                        borderColor: playViz.color,
                        filter: 'grayscale(100%)'
                      }}
                    />
                  </div>
                </div>
              </div>
              {/* Penalty gesture emojis on both sides */}
                <div
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 text-2xl"
                style={{ 
                  left: `${endX - 8}%`,
                  top: '60%',
                  filter: `drop-shadow(0 0 10px ${playViz.glowColor})`
                }}
                >
                🙅🏻‍♂️
                </div>
                <div
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 text-2xl"
                style={{ 
                  left: `${endX + 8}%`,
                  top: '60%',
                  filter: `drop-shadow(0 0 10px ${playViz.glowColor})`
                }}
                >
                🙅🏾‍♂️
                </div>
            </>
          );
        }
        
        // Sack - headshot of the sacker with crash animation
        if (playViz.animate === 'sack') {
          return (
            <div
              className="absolute z-10 animate-sack-crash"
              style={{ 
                left: `${startX}%`,
                top: '60%',
                '--distance': distance
              } as React.CSSProperties}
            >
              <div className="relative group">
                <div 
                  className="w-20 h-16 rounded-full flex items-center justify-center shadow-2xl"
                  style={{
                    backgroundColor: `${playViz.color}30`,
                    boxShadow: `0 0 20px ${playViz.glowColor}`
                  }}
                >
                  <img
                    src={lastPlay.athletesInvolved[0].headshot}
                    alt={lastPlay.athletesInvolved[0].displayName}
                    className="w-14 h-14 rounded-full object-cover z-1 border-2"
                    style={{ borderColor: playViz.color }}
                  />
                </div>
              </div>
            </div>
          );
        }
        
        // Default - static position at end
        return (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
            style={{ 
              left: `${endX}%`,
              top: '60%'
            }}
          >
            <div className="relative group">
              <div 
                className="w-20 h-16 rounded-full flex items-center justify-center shadow-2xl"
                style={{
                  backgroundColor: `${playViz.color}30`,
                  boxShadow: `0 0 20px ${playViz.glowColor}`
                }}
              >
                <img
                  src={lastPlay.athletesInvolved[0].headshot}
                  alt={lastPlay.athletesInvolved[0].displayName}
                  className="w-14 h-14 rounded-full object-cover z-1 border-2"
                  style={{ borderColor: playViz.color }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      const fallback = document.createElement('div');
                      fallback.className = 'flex items-center justify-center text-2xl';
                      fallback.innerHTML = playViz.icon;
                      parent.appendChild(fallback);
                    }
                  }}
                />
              </div>
              {/* Player name tooltip */}
              <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-[#23263a] border rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-[9999]"
                style={{ borderColor: `${playViz.color}80` }}
              >
                <p className="text-xs font-bold" style={{ color: playViz.color }}>{lastPlay.athletesInvolved[0].displayName}</p>
                <p className="text-[#b0b7bf] text-xs">{lastPlay.athletesInvolved[0].position}</p>
              </div>
            </div>
          </div>
        );
      })()}
    </div>

      {/* Latest Play - Only show if showGameInfo is true */}
      {showGameInfo && playLog.length > 0 && (() => {
        const latestPlay = playLog[0];
        const team = latestPlay.possession === homeTeam?.id ? homeTeam : awayTeam;
        const isHome = team?.id === homeTeam?.id;

        return (
          <div className="mt-4">
            <div className="text-[#b0b7bf] text-xs mb-2 flex items-center gap-2">
              <FaFootballBall className="text-[#00ffe7]" />
              Latest Play
            </div>
            <div className={`bg-gradient-to-r ${isHome ? 'from-[#faafe8]/10' : 'from-[#00ffe7]/10'} rounded-lg p-3 border-l-2 ${isHome ? 'border-[#faafe8]' : 'border-[#00ffe7]'}`}>
              <div className="flex items-center gap-2 mb-2">
                <img src={getTeamLogo(team?.team)} alt="" className="w-5 h-5" />
                <span className={`text-xs font-bold ${isHome ? 'text-[#faafe8]' : 'text-[#00ffe7]'}`}>
                  Q{latestPlay.quarter} {latestPlay.clock}
                </span>
              </div>
              
              {/* Player headshots */}
              {latestPlay.athletesInvolved && latestPlay.athletesInvolved.length > 0 && (
                <div className="flex gap-2 mb-2">
                  {latestPlay.athletesInvolved.slice(0, 3).map((athlete, idx) => (
                    athlete.headshot && (
                      <div key={idx} className="flex items-center gap-1">
                        <img
                          src={athlete.headshot}
                          alt={athlete.displayName}
                          className="w-8 h-8 rounded-full border-2 border-[#00ffe7]/30"
                        />
                        <div className="flex flex-col">
                          <span className="text-[#e0e7ef] text-xs font-semibold">{athlete.shortName}</span>
                          <span className="text-[#b0b7bf] text-[10px]">{athlete.position}</span>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              )}
              
              <p className="text-[#e0e7ef] text-xs">
                {latestPlay.text}
              </p>
            </div>
          </div>
        );
      })()}
      </div>
    </div>
  );
};

export default FootballField;
