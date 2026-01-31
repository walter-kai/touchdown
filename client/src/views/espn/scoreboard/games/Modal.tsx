import React from 'react';
import { FaTimes } from 'react-icons/fa';
import PredictionChart from '@/components/espn/PredictionChart';
import GameLeaders from '@/views/espn/summary/GameLeaders';
import PointsChart from '@/components/espn/PointsChart';
import type { Summary } from '@/types/espn/summary';

interface ScoringPlay {
  text: string;
  quarter: number;
  clock: string;
  timestamp: Date;
  homeScore?: number;
  awayScore?: number;
}

interface ModalProps {
  modalView: 'prediction' | 'leaders' | 'stats' | 'scoring' | null;
  onClose: () => void;
  gameDataNotFound: boolean;
  homeTeam: any;
  awayTeam: any;
  gameId?: string;
  competition: any;
  getTeamLogo: (team: any) => string;
  summary?: Summary | null;
  scoringPlays: ScoringPlay[];
}

const Modal: React.FC<ModalProps> = ({
  modalView,
  onClose,
  gameDataNotFound,
  homeTeam,
  awayTeam,
  gameId,
  competition,
  getTeamLogo,
  summary,
  scoringPlays,
}) => {
  if (!modalView) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm" 
      style={{ zIndex: 9999 }} 
      onClick={onClose}
    >
      <div 
        className="bg-bg-darkest border-2 border-neon-cyan rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-4" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-bg-darkest border-b border-neon-cyan/30 p-4 flex items-center justify-between z-10">
          <h2 className="text-neon-cyan font-bold text-xl">
            {modalView === 'prediction' && 'Game Prediction'}
            {modalView === 'leaders' && 'Game Leaders'}
            {modalView === 'stats' && 'Team Statistics'}
            {modalView === 'scoring' && 'Scoring by Time'}
          </h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-neon-pink transition-colors p-2"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4">
          {modalView === 'prediction' && (
            <div>
              {gameDataNotFound && (
                <div className="mb-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <p className="text-yellow-400 text-sm text-center">
                    ⚠️ Game leaderboard data is not available yet. Check back later!
                  </p>
                </div>
              )}
              {homeTeam && awayTeam && gameId && (
                <PredictionChart
                  gameId={gameId}
                  competitionId={competition.id}
                  homeTeamInfo={{
                    name: homeTeam.team.displayName,
                    logo: getTeamLogo(homeTeam),
                    color: homeTeam.team.color || '00ffe7'
                  }}
                  awayTeamInfo={{
                    name: awayTeam.team.displayName,
                    logo: getTeamLogo(awayTeam),
                    color: awayTeam.team.color || 'faafe8'
                  }}
                  getTeamLogo={getTeamLogo}
                  homeTeam={homeTeam.team}
                  awayTeam={awayTeam.team}
                />
              )}
            </div>
          )}

          {modalView === 'leaders' && (
            <GameLeaders 
              summary={summary}
              homeTeamId={homeTeam?.id}
              awayTeamId={awayTeam?.id}
            />
          )}

          {modalView === 'scoring' && (
            <div>
              {scoringPlays && scoringPlays.length > 0 ? (
                <PointsChart
                  gameId={gameId || ''}
                  homeTeamInfo={{
                    name: homeTeam?.team?.displayName || '',
                    logo: getTeamLogo(homeTeam?.team) || '',
                    color: homeTeam?.team?.color || '00ffe7'
                  }}
                  awayTeamInfo={{
                    name: awayTeam?.team?.displayName || '',
                    logo: getTeamLogo(awayTeam?.team) || '',
                    color: awayTeam?.team?.color || 'faafe8'
                  }}
                  scoringPlays={scoringPlays}
                  gameStatus={competition?.status?.type?.state || 'pre'}
                />
              ) : (
                <p className="text-text-muted text-center py-8">No scoring data available yet</p>
              )}
            </div>
          )}

          {modalView === 'stats' && (
            <div>
              {summary?.boxscore?.teams && summary.boxscore.teams.length === 2 ? (
                <div className="space-y-4">
                  {/* Team Headers */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="flex items-center justify-center">
                      <img
                        src={getTeamLogo(summary.boxscore.teams.find((t: any) => t.homeAway === 'away')?.team)}
                        alt={summary.boxscore.teams.find((t: any) => t.homeAway === 'away')?.team.displayName}
                        className="w-10 h-10"
                      />
                    </div>
                    <div className="flex items-center justify-center">
                      <p className="text-text-muted text-sm font-semibold">Stat</p>
                    </div>
                    <div className="flex items-center justify-center">
                      <img
                        src={getTeamLogo(summary.boxscore.teams.find((t: any) => t.homeAway === 'home')?.team)}
                        alt={summary.boxscore.teams.find((t: any) => t.homeAway === 'home')?.team.displayName}
                        className="w-10 h-10"
                      />
                    </div>
                  </div>

                  {/* Stats Comparison */}
                  {summary.boxscore.teams[0].statistics.map((_: any, statIdx: number) => {
                    const awayTeamData = summary.boxscore.teams.find((t: any) => t.homeAway === 'away');
                    const homeTeamData = summary.boxscore.teams.find((t: any) => t.homeAway === 'home');
                    const awayStat = awayTeamData?.statistics[statIdx];
                    const homeStat = homeTeamData?.statistics[statIdx];

                    if (!awayStat || !homeStat) return null;

                    return (
                      <div key={`stat-${statIdx}`} className="grid grid-cols-3 gap-4 items-center bg-bg-darker/50 rounded-lg p-3 border border-neon-cyan/10">
                        <div className="text-center">
                          <p className="text-neon-cyan font-bold text-lg">
                            {awayStat.displayValue}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-text-muted text-sm font-semibold">
                            {awayStat.label}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-neon-cyan font-bold text-lg">
                            {homeStat.displayValue}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-text-muted text-center py-8">Team statistics will be available after the game.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
