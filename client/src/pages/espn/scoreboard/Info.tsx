import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaFootballBall } from 'react-icons/fa';
import FootballField from '@/pages/espn/gamesThisWeek/FootballField';
import type { Play } from '@/types/espn/playByplay';
import PlayLog from '@/components/espn/PlayLog';
import GameLeaders from '@/pages/espn/summary/GameLeaders';
import PredictionChart from '@/pages/espn/gameView/info/PredictionChart';
import { CountUpScore } from '@/components/common/CountUpScore';
import { usePlays } from '@/providers/PlaysContext';
import { useLeague } from '@/providers/LeagueContext';
import { getHeadshotUrl } from '@/utils/espnImages';
import type { Summary } from '@/types/espn/summary';

interface InfoProps {
  homeTeam: any;
  awayTeam: any;
  competition: any;
  getTeamLogo: (team: any) => string;
  gameCountdown?: number;
  summary?: Summary | null;
  gameId?: string;
  countdown?: number;
  playLog: Play[];
  homeTeamId?: string;
  awayTeamId?: string;
  onOpenPicks?: () => void;
}

const Info: React.FC<InfoProps> = ({
  homeTeam,
  awayTeam,
  competition,
  getTeamLogo,
  gameCountdown = 0,
  summary,
  gameId,
  playLog,
  countdown = 30,
  homeTeamId,
  awayTeamId,
  onOpenPicks,
}) => {
  const navigate = useNavigate();
  const { homeScore: contextHomeScore, awayScore: contextAwayScore } = usePlays();
  const currentHomeScore = contextHomeScore ?? (homeTeam?.score !== undefined ? Number(homeTeam.score) : 0);
  const currentAwayScore = contextAwayScore ?? (awayTeam?.score !== undefined ? Number(awayTeam.score) : 0);

  // Derive league from URL to avoid race condition with LeagueContext
  const urlLeague = window.location.pathname.startsWith('/nba') ? 'nba' : 'nfl';

  const [currentPicks, setCurrentPicks] = useState<any[]>([]);
  const [picksScores, setPicksScores] = useState<Record<string, number>>({});

  // Load picks from localStorage
  useEffect(() => {
    if (!homeTeamId || !awayTeamId) return;
    
    const savedState = localStorage.getItem(`playerPick_${homeTeamId}_${awayTeamId}`);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.players && parsed.players.length > 0) {
          setCurrentPicks(parsed.players);
          
          // Calculate scores from playLog
          const scores: Record<string, number> = {};
          parsed.players.forEach((player: any) => {
            scores[player.id] = 0;
            playLog.forEach(play => {
              if (play.athletesInvolved?.some((a: any) => a?.id === player.id)) {
                scores[player.id]++;
              }
            });
          });
          setPicksScores(scores);
        }
      } catch (e) {
        console.error('Error loading picks:', e);
      }
    }
  }, [homeTeamId, awayTeamId, playLog]);

  const latestPlay: Play | undefined = playLog?.[0];
  const latestPlayType = typeof latestPlay?.type === 'string'
    ? latestPlay.type
    : (latestPlay?.type as any)?.text || (latestPlay?.type as any)?.displayName || '';
  const compState = competition.status?.type?.state ?? '';
  const livePeriod = latestPlay?.quarter ?? competition.status.period;
  const liveClock = latestPlay?.clock ?? competition.status.displayClock;
  const endOfGameByText = /end of.*game|final/i.test(latestPlayType || latestPlay?.text || '');
  const isFinal = compState === 'post' || endOfGameByText;
  const liveState = isFinal ? 'post' : (compState === 'pre' ? 'pre' : compState);
  const livePossession = latestPlay?.possession || competition.situation?.possession;

  return (
    <>
      <div className='mx-2'>
        {/* Box Score */}
        <div>
          {/* Grid for Game Info */}
          <div className="grid grid-cols-2 gap-2 mb-2">
        {/* Date & Time */}
        <div className="bg-bg-dark/50 rounded-lg p-4 border border-neon-cyan/20">
          <p className="text-text-muted text-xs mb-1">Game Date</p>
          {competition.date ? (
              <p className="text-neon-cyan font-bold text-lg">
                {new Date(competition.date).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            ) : (
              <p className="text-text-light text-sm">-</p>
            )}
          </div>

          {/* Game Status */}
          <div className="bg-bg-dark/50 rounded-lg p-4 border border-neon-cyan/20">
            <p className="text-text-muted text-xs mb-1">{liveState === 'pre' ? 'Starts In' : 'Status'}</p>
          {liveState === 'in' ? (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              <span className="text-red-500 font-bold text-lg">LIVE</span>
              <span className="text-text-light font-bold">Q{livePeriod} - {liveClock}</span>
            </div>
          ) : liveState === 'post' ? (
            <span className="text-text-muted font-bold text-lg">FINAL</span>
          ) : (
            <div>
              <span className="text-text-light font-bold text-lg">
                {(() => {
                  const days = Math.floor(gameCountdown / (1000 * 60 * 60 * 24));
                  const hours = Math.floor((gameCountdown % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                  const minutes = Math.floor((gameCountdown % (1000 * 60 * 60)) / (1000 * 60));
                  const seconds = Math.floor((gameCountdown % (1000 * 60)) / 1000);
                  
                  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
                  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
                  if (minutes > 0) return `${minutes}m ${seconds}s`;
                  return `${seconds}s`;
                })()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Team Scores */}
      <div className="border border-neon-cyan/30 rounded-lg bg-bg-dark/30">
        <div className="flex items-center justify-between">
          {/* Away Team */}
          <button
            onClick={() => awayTeam?.id && navigate(`/nfl/team/${awayTeam.id}`)}
            className="flex flex-col items-center hover:bg-neon-cyan/10 active:bg-neon-cyan/20 rounded-lg py-3 transition-all group cursor-pointer flex-1 focus:outline-none"
          >
            <img
              src={getTeamLogo(awayTeam?.team)}
              alt={awayTeam?.team?.displayName}
              className="w-20 h-20 md:w-20 md:h-20 mb-2 group-hover:scale-110 transition-transform"
            />
            <h2 className="text-text-light font-bold text-sm md:text-base text-center px-2 group-hover:text-neon-cyan transition-colors">
              {awayTeam?.team?.displayName}
            </h2>
            <p className="text-text-muted text-xs">{awayTeam?.records?.[0]?.summary}</p>
          </button>

          {/* Center Scores */}
          <div className="flex items-center gap-4 px-6">
            <CountUpScore 
              value={currentAwayScore}
              className="text-neon-cyan text-4xl md:text-5xl font-bold"
            />
            <span className="text-text-muted text-2xl">-</span>
            <CountUpScore 
              value={currentHomeScore}
              className="text-neon-cyan text-4xl md:text-5xl font-bold"
            />
          </div>

          {/* Home Team */}
          <button
            onClick={() => homeTeam?.id && navigate(`/nfl/team/${homeTeam.id}`)}
            className="flex flex-col items-center hover:bg-neon-cyan/10 active:bg-neon-cyan/20 rounded-lg py-3 transition-all group cursor-pointer flex-1 focus:outline-none"
          >
            <img
              src={getTeamLogo(homeTeam?.team)}
              alt={homeTeam?.team?.displayName}
              className="w-20 h-20 md:w-20 md:h-20 mb-2 group-hover:scale-110 transition-transform"
            />
            <h2 className="text-text-light font-bold text-sm md:text-base text-center px-2 group-hover:text-neon-cyan transition-colors">
              {homeTeam?.team?.displayName}
            </h2>
            <p className="text-text-muted text-xs">{homeTeam?.records?.[0]?.summary}</p>
          </button>
        </div>
      </div>
        </div>
      </div>


      
      {/* Live Game Situation */}
      {(competition.status.type.state === 'in') && (
        <div className="">
          {(() => {
            const situation = latestPlay
              ? {
                  lastPlay: latestPlay,
                  possession: latestPlay.possession,
                  downDistanceText: competition.situation?.downDistanceText,
                  awayTimeouts: competition.situation?.awayTimeouts,
                  homeTimeouts: competition.situation?.homeTimeouts,
                }
              : competition.situation
                ? {
                    ...competition.situation,
                    possession: competition.situation.possession,
                  }
                : undefined;

            if (!situation || !situation.lastPlay) return null;

            return (
              <div className="">
                <div className="pt-2 ">
                  <div className='mx-2'>
                    {/* Down & Distance and Possession - Above Field */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {/* Down & Distance */}
                      <div className="bg-bg-dark/50 rounded-lg p-3 border border-neon-pink/20">
                        <p className="text-text-muted text-xs mb-1">Down & Distance</p>
                        {competition.situation?.downDistanceText ? (
                          <p className="text-neon-pink font-bold text-base">{competition.situation.downDistanceText}</p>
                        ) : (
                          <p className="text-text-light text-sm">-</p>
                        )}
                      </div>

                      {/* Possession */}
                      <div className="bg-bg-dark/50 rounded-lg p-3 border border-neon-cyan/20">
                        <p className="text-text-muted text-xs mb-1">Possession</p>
                        {livePossession ? (
                          <div className="flex items-center gap-2">
                            {homeTeam?.id && awayTeam?.id && (
                              <img
                                src={livePossession === homeTeam?.id ? getTeamLogo(homeTeam?.team) : getTeamLogo(awayTeam?.team)}
                                alt="Possession"
                                className="w-6 h-6"
                              />
                            )}
                            <p className="text-neon-cyan font-bold text-base">
                              {livePossession === homeTeam?.id ? homeTeam?.team.abbreviation : awayTeam?.team.abbreviation}
                            </p>
                          </div>
                        ) : (
                          <p className="text-text-light text-sm">-</p>
                        )}
                      </div>
                    </div>

                    {/* Timeouts and Play Type - Combined Row */}
                    <div className="flex items-center justify-between gap-3 mb-3 bg-bg-dark/30 rounded-xl p-3 border border-neon-cyan/20">
                      {/* Away Team Timeouts */}
                      <div className="flex items-center gap-2">
                        <span className="text-text-muted text-xs font-semibold">{awayTeam?.team.abbreviation}</span>
                        <div className="flex gap-1">
                          {[1, 2, 3].map((_, idx) => (
                            <div
                              key={idx}
                              className={`w-2 h-2 rounded-full ${
                                idx < (situation.awayTimeouts ?? 3)
                                  ? 'bg-neon-cyan shadow-[0_0_8px_rgba(0,255,231,0.6)]'
                                  : 'bg-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Play Type - Center */}
                      <div className="flex-1 flex justify-center">
                        <div className="px-4 py-1.5 bg-yellow-500/20 border border-yellow-500/50 rounded-full">
                          <span className="text-yellow-400 font-bold text-sm">
                            {latestPlayType || 'Play'}
                          </span>
                        </div>
                      </div>

                      {/* Home Team Timeouts */}
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {[1, 2, 3].map((_, idx) => (
                            <div
                              key={idx}
                              className={`w-2 h-2 rounded-full ${
                                idx < (situation.homeTimeouts ?? 3)
                                  ? 'bg-neon-pink shadow-[0_0_8px_rgba(250,175,232,0.6)]'
                                  : 'bg-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-text-muted text-xs font-semibold">{homeTeam?.team.abbreviation}</span>
                      </div>
                    </div>

                    <FootballField
                      homeTeam={homeTeam}
                      awayTeam={awayTeam}
                      lastPlay={situation.lastPlay}
                      situation={situation}
                      playLog={playLog}
                      getTeamLogo={getTeamLogo}
                    />

          {/* Current Picks Display */}
          {currentPicks.length > 0 && (
            <div className="bg-bg-dark/50 rounded-lg p-3 border border-neon-pink/20 my-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-neon-pink text-xs font-bold">YOUR PICKS</span>
                <span className="text-text-muted text-[10px]">
                  Total: {Object.values(picksScores).reduce((sum, score) => sum + score, 0)} pts
                </span>
              </div>
              <div className="flex gap-2 mb-3 overflow-x-auto">
                {currentPicks.map((player, idx) => {
                  // Use utility with URL-derived league to avoid context race condition
                  const headshotUrl = getHeadshotUrl({ id: player.id, headshot: player.headshot }, urlLeague);
                  return (
                    <div key={player.id} className="flex flex-col items-center min-w-[60px]">
                      {headshotUrl ? (
                        <img
                          src={headshotUrl}
                          alt={player.displayName}
                          className="w-12 h-12 rounded-full object-cover border-2 border-neon-pink/50"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                            const fallback = (e.currentTarget as HTMLImageElement).nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className="w-12 h-12 rounded-full bg-bg-darker border-2 border-neon-pink/50 flex items-center justify-center"
                        style={{ display: headshotUrl ? 'none' : 'flex' }}
                      >
                        <span className="text-neon-pink text-xs font-bold">
                          {player.shortName?.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-white text-[10px] font-bold mt-1 text-center truncate w-full">
                        {player.shortName}
                      </span>
                      <span className="text-neon-pink text-lg font-bold">{picksScores[player.id] || 0}</span>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={onOpenPicks}
                className="w-full bg-neon-pink/20 hover:bg-neon-pink/30 border border-neon-pink/50 rounded-lg py-2 text-neon-pink font-bold text-sm transition-all"
              >
                Manage Picks
              </button>
            </div>
          )}

                    {/* Play Log */}
                    <div className="mt-2">
                      <PlayLog
                        playLog={playLog}
                        homeTeam={homeTeam}
                        awayTeam={awayTeam}
                        getTeamLogo={getTeamLogo}
                        title="Play Log"
                        showTitle={true}
                        countdown={countdown}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Pre-game or Post-game Info */}
      {competition.status.type.state !== 'in' && (
        <div className="text-center">
            {/* Line Scores */}
            {(homeTeam?.linescores || awayTeam?.linescores) && (
              <div className="p-2">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-neon-cyan/20">
                        <th className="text-left text-text-muted font-semibold py-2">Team</th>
                        {[1, 2, 3, 4].map(q => (
                          <th key={q} className="text-center text-text-muted font-semibold py-2">Q{q}</th>
                        ))}
                        {(homeTeam?.linescores?.length ?? 0) > 4 && (
                          <th className="text-center text-text-muted font-semibold py-2">OT</th>
                        )}
                        <th className="text-center text-text-muted font-semibold py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-neon-cyan/10">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <img src={getTeamLogo(awayTeam?.team)} alt={awayTeam?.team.abbreviation} className="w-7 h-6" />
                            <span className="text-text-light font-bold">{awayTeam?.team.abbreviation}</span>
                          </div>
                        </td>
                        {awayTeam?.linescores?.map((score: any, idx: number) => (
                          <td key={idx} className="text-center text-text-light py-3">
                            <CountUpScore value={parseInt(score.displayValue) || 0} duration={800} />
                          </td>
                        ))}
                        <td className="text-center text-neon-cyan font-bold py-3">
                          <CountUpScore value={currentAwayScore} />
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <img src={getTeamLogo(homeTeam?.team)} alt={homeTeam?.team.abbreviation} className="w-7 h-6" />
                            <span className="text-text-light font-bold">{homeTeam?.team.abbreviation}</span>
                          </div>
                        </td>
                        {homeTeam?.linescores?.map((score: any, idx: number) => (
                          <td key={idx} className="text-center text-text-light py-3">
                            <CountUpScore value={parseInt(score.displayValue) || 0} duration={800} />
                          </td>
                        ))}
                        <td className="text-center text-neon-pink font-bold py-3">
                          <CountUpScore value={currentHomeScore} />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
        </div>
      )}


            {/* Predictions */}
      <div className=" ">
        {/* Divider */}
        <div className="border-t-2 border-neon-cyan/20 pt-2 mb-4"></div>
        <div className="mx-2">
          <div className="flex items-center pb-3">
            <h1>Game Prediction</h1>
          </div>
        </div>
        <div className="mx-2">
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
      </div>

      {/* Head-to-Head Leaders - Condensed */}
      <GameLeaders 
        summary={summary}
        homeTeamId={homeTeam?.id}
        awayTeamId={awayTeam?.id}
      />

      {/* Team Statistics */}
      <div className="mt-6">
        {/* Divider */}
        <div className="border-t-2 border-neon-cyan/20 pt-2 mb-4"></div>
        <div className="mx-2">
          <div className="flex items-center pb-3">
            <h1>Team Statistics</h1>
          </div>

          {summary?.boxscore?.teams && summary.boxscore.teams.length === 2 ? (
          <div className="space-y-4">
            {/* Team Headers */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="flex items-center justify-center">
                <img
                  src={getTeamLogo(summary.boxscore.teams.find((t: any) => t.homeAway === 'away')?.team)}
                  alt={summary.boxscore.teams.find((t: any) => t.homeAway === 'away')?.team.displayName}
                  className="w-12 h-12"
                />
              </div>
              <div className="flex items-center justify-center">
                <p className="text-text-muted text-sm font-semibold">Stat</p>
              </div>
              <div className="flex items-center justify-center">
                <img
                  src={getTeamLogo(summary.boxscore.teams.find((t: any) => t.homeAway === 'home')?.team)}
                  alt={summary.boxscore.teams.find((t: any) => t.homeAway === 'home')?.team.displayName}
                  className="w-12 h-12"
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
      </div>

    </>
  );
};

export default Info;