import React, { useEffect, useState } from 'react';
import { FaUsers } from 'react-icons/fa';

interface Athlete {
  id: string;
  displayName: string;
  shortName: string;
  position: {
    abbreviation: string;
  } | string;
  headshot?: string | { href: string };
  jersey?: string;
  team?: {
    id: string;
    logo?: string;
  };
}

interface SelectedAthletesProps {
  gameId?: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  playLog: Array<{
    text: string;
    athletesInvolved?: Array<{
      id: string;
      displayName: string;
      team: { id: string };
    }>;
  }>;
  homeRoster?: Array<{
    id: string;
  }>;
  awayRoster?: Array<{
    id: string;
  }>;
}

const SelectedAthletes: React.FC<SelectedAthletesProps> = ({
  gameId,
  homeTeamId,
  awayTeamId,
  homeTeamLogo,
  awayTeamLogo,
  playLog,
  homeRoster = [],
  awayRoster = []
}) => {
  const [selectedPlayers, setSelectedPlayers] = useState<Athlete[]>([]);
  const [currentSetScores, setCurrentSetScores] = useState<Record<string, number>>({});
  const [totalScore, setTotalScore] = useState(0);

  // Load user picks from localStorage or backend
  useEffect(() => {
    const loadUserPicks = async () => {
      try {
        // First try backend
        const token = localStorage.getItem('dexter_access_token');
        if (token && gameId) {
          const response = await fetch(`/api/picks/game/${gameId}/user`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const result = await response.json();
            // New structure: result.picks.picks is an array of pick submissions
            if (result.picks && result.picks.picks && result.picks.picks.length > 0) {
              // Get the most recent pick (last in array)
              const latestPick = result.picks.picks[result.picks.picks.length - 1];
              setSelectedPlayers(latestPick.players);
              setTotalScore(latestPick.totalScore || 0);
              return;
            }
          }
        }
      } catch (error) {
        console.error('Error loading user picks from backend:', error);
      }
      
      // Fallback to localStorage
      const savedState = localStorage.getItem(`playerPick_${homeTeamId}_${awayTeamId}`);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        if (parsed.players && parsed.players.length > 0) {
          setSelectedPlayers(parsed.players);
          setTotalScore(parsed.totalScore || 0);
        }
      }
    };
    
    loadUserPicks();
  }, [gameId, homeTeamId, awayTeamId]);

  // Calculate scores based on playLog
  useEffect(() => {
    if (selectedPlayers.length === 0) {
      setCurrentSetScores({});
      return;
    }

    const scores: Record<string, number> = {};
    selectedPlayers.forEach(player => {
      scores[player.id] = 0;
    });

    playLog.forEach(play => {
      if (play.athletesInvolved) {
        play.athletesInvolved.forEach(athlete => {
          if (scores.hasOwnProperty(athlete.id)) {
            scores[athlete.id]++;
          }
        });
      }
    });

    setCurrentSetScores(scores);
  }, [playLog, selectedPlayers]);

  return (
    <div className="w-full">
      {/* Minimalistic Score List - Vertical table format - Always show when there are selected players */}
      {selectedPlayers.length > 0 && (
        <div className="bg-bg-dark/50 rounded-lg p-3 mb-4 border border-neon-cyan/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-neon-cyan text-xs font-bold">SELECTED PICKS</span>
            <span className="text-text-muted text-[10px]">Total: {totalScore + Object.values(currentSetScores).reduce((sum, score) => sum + score, 0)} pts</span>
          </div>
          <div className="space-y-2">
            {selectedPlayers.map((player, idx) => {
              const headshotUrl = typeof player.headshot === 'string' ? player.headshot : player.headshot?.href;
              // Find team info
              const isHome = homeRoster.some(p => p.id === player.id);
              const teamLogo = isHome ? homeTeamLogo : awayTeamLogo;
              
              return (
                <div key={player.id} className="relative overflow-hidden flex items-center gap-2 bg-bg-dark/90 rounded-lg p-2 border border-neon-cyan/30">
                  {/* Large team logo background */}
                  {teamLogo && (
                    <img 
                      src={teamLogo} 
                      alt="" 
                      className="absolute right-[10%] top-1/2 -translate-y-1/2 opacity-10 pointer-events-none"
                      style={{
                        width: '80px',
                        height: '80px',
                        objectFit: 'contain'
                      }}
                    />
                  )}
                    
                  {headshotUrl ? (
                    <img
                      src={headshotUrl}
                      alt={player.displayName}
                      className="w-8 h-8 rounded-full object-cover border-2 border-neon-cyan/50 flex-shrink-0 relative z-10"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                        const fallback = (e.currentTarget as HTMLImageElement).nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className="w-8 h-8 rounded-full bg-bg-darker border-2 border-neon-cyan/50 flex items-center justify-center flex-shrink-0 relative z-10"
                    style={{ display: headshotUrl ? 'none' : 'flex' }}
                  >
                    <FaUsers className="text-neon-cyan text-xs" />
                  </div>
                  <div className="flex-1 min-w-0 relative z-10">
                    <span className="text-white text-xs font-bold truncate block">{player.shortName}</span>
                    <span className="text-neon-cyan text-[10px] truncate block">
                      {typeof player.position === 'string' ? player.position : player.position?.abbreviation}
                      {player.jersey && ` • #${player.jersey}`}
                    </span>
                  </div>
                  <div className="text-center relative z-10 flex-shrink-0">
                    <div className="text-lg font-bold text-neon-cyan">{currentSetScores[player.id] || 0}</div>
                    <div className="text-text-muted text-[8px]">PTS</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state message when no players selected */}
      {selectedPlayers.length === 0 && (
        <div className="bg-bg-dark/50 rounded-lg p-4 mb-4 border border-neon-cyan/10 text-center">
          <FaUsers className="text-neon-cyan/30 text-2xl mx-auto mb-2" />
          <p className="text-text-muted text-xs">No picks selected yet</p>
        </div>
      )}
    </div>
  );
};

export default SelectedAthletes;
