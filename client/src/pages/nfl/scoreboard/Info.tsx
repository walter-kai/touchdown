import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaFootballBall } from 'react-icons/fa';
import FootballField from '@/components/nfl/FootballField';
import PlayLog from '@/components/nfl/PlayLog';
import GameLeaders from '@/pages/nfl/summary/GameLeaders';
import PredictionChart from '@/components/nfl/PredictionChart';
import { CountUpScore } from '@/components/common/CountUpScore';
import type { Summary } from '@/types/espn/summary';
import { Play } from '@/types/espn/playByplay';

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
}) => {
  const navigate = useNavigate();

  return (
    <>
      <div className='mx-2'>
        {/* Box Score */}
        <div>
          {/* 2x2 Grid for Game Info */}
          <div className="grid grid-cols-2 gap-2 mb-2">
        {/* Date & Time */}
        <div className="bg-[#181a23]/50 rounded-lg p-4 border border-[#00ffe7]/20">
          <p className="text-[#b0b7bf] text-xs mb-1">Game Date</p>
          {competition.date ? (
              <p className="text-[#00ffe7] font-bold text-lg">
                {new Date(competition.date).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            ) : (
              <p className="text-[#e0e7ef] text-sm">-</p>
            )}
          </div>

          {/* Game Status */}
          <div className="bg-[#181a23]/50 rounded-lg p-4 border border-[#00ffe7]/20">
            <p className="text-[#b0b7bf] text-xs mb-1">{competition.status.type.state === 'pre' ? 'Starts In' : 'Status'}</p>
          {competition.status.type.state === 'in' ? (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              <span className="text-red-500 font-bold text-lg">LIVE</span>
              <span className="text-[#e0e7ef] font-bold">Q{competition.status.period} - {competition.status.displayClock}</span>
            </div>
          ) : competition.status.type.state === 'post' ? (
            <span className="text-[#b0b7bf] font-bold text-lg">FINAL</span>
          ) : (
            <div>
              <span className="text-[#e0e7ef] font-bold text-lg">
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

        {/* Down & Distance - Only show for live games */}
        {competition.status.type.state === 'in' && (
          <div className="bg-[#181a23]/50 rounded-lg p-4 border border-[#faafe8]/20">
            <p className="text-[#b0b7bf] text-xs mb-1">Down & Distance</p>
            {competition.situation?.downDistanceText ? (
              <p className="text-[#faafe8] font-bold text-lg">{competition.situation.downDistanceText}</p>
            ) : (
              <p className="text-[#e0e7ef] text-sm">-</p>
            )}
          </div>
        )}

        {/* Possession - Only show for live games */}
        {competition.status.type.state === 'in' && (
          <div className="bg-[#181a23]/50 rounded-lg p-4 border border-[#00ffe7]/20">
            <p className="text-[#b0b7bf] text-xs mb-1">Possession</p>
            {competition.situation?.possession ? (
              <div className="flex items-center gap-2">
                <img
                  src={competition.situation.possession === homeTeam?.id ? getTeamLogo(homeTeam?.team) : getTeamLogo(awayTeam?.team)}
                  alt="Possession"
                  className="w-8 h-8"
                />
                <p className="text-[#00ffe7] font-bold text-lg">
                  {competition.situation.possession === homeTeam?.id ? homeTeam?.team.abbreviation : awayTeam?.team.abbreviation}
                </p>
              </div>
            ) : (
              <p className="text-[#e0e7ef] text-sm">-</p>
            )}
          </div>
        )}
      </div>

      {/* Team Scores */}
      <div className="border border-[#00ffe7]/30 rounded-lg bg-[#181a23]/30">
        <div className="flex items-center justify-between">
          {/* Away Team */}
          <button
            onClick={() => awayTeam?.id && navigate(`/nfl/team/${awayTeam.id}`)}
            className="flex flex-col items-center hover:bg-[#00ffe7]/10 active:bg-[#00ffe7]/20 rounded-lg py-3 transition-all group cursor-pointer flex-1 focus:outline-none"
          >
            <img
              src={getTeamLogo(awayTeam?.team)}
              alt={awayTeam?.team?.displayName}
              className="w-20 h-20 md:w-20 md:h-20 mb-2 group-hover:scale-110 transition-transform"
            />
            <h2 className="text-[#e0e7ef] font-bold text-sm md:text-base text-center px-2 group-hover:text-[#00ffe7] transition-colors">
              {awayTeam?.team?.displayName}
            </h2>
            <p className="text-[#b0b7bf] text-xs">{awayTeam?.records?.[0]?.summary}</p>
          </button>

          {/* Center Scores */}
          <div className="flex items-center gap-4 px-6">
            <CountUpScore 
              value={awayTeam?.score || 0} 
              className="text-[#00ffe7] text-4xl md:text-5xl font-bold"
            />
            <span className="text-[#b0b7bf] text-2xl">-</span>
            <CountUpScore 
              value={homeTeam?.score || 0} 
              className="text-[#00ffe7] text-4xl md:text-5xl font-bold"
            />
          </div>

          {/* Home Team */}
          <button
            onClick={() => homeTeam?.id && navigate(`/nfl/team/${homeTeam.id}`)}
            className="flex flex-col items-center hover:bg-[#00ffe7]/10 active:bg-[#00ffe7]/20 rounded-lg py-3 transition-all group cursor-pointer flex-1 focus:outline-none"
          >
            <img
              src={getTeamLogo(homeTeam?.team)}
              alt={homeTeam?.team?.displayName}
              className="w-20 h-20 md:w-20 md:h-20 mb-2 group-hover:scale-110 transition-transform"
            />
            <h2 className="text-[#e0e7ef] font-bold text-sm md:text-base text-center px-2 group-hover:text-[#00ffe7] transition-colors">
              {homeTeam?.team?.displayName}
            </h2>
            <p className="text-[#b0b7bf] text-xs">{homeTeam?.records?.[0]?.summary}</p>
          </button>
        </div>
      </div>
        </div>
      </div>
      
      {/* Leaders Section - Compact */}
      {competition.leaders && competition.leaders.length > 0 && (
        <div className="mt-4">
          {/* Divider */}
          <div className="border-t-2 border-[#00ffe7]/20 pt-2 mb-4"></div>
          <div className="mx-2">
            <div className="flex items-center mb-6 pb-3 border-b border-[#00ffe7]/10">
              <h1>Leaders</h1>
            </div>
          </div>
          <div className="mx-2">
            <div className="grid grid-cols-3 gap-3">
              {competition.leaders.slice(0, 3).map((category: any, categoryIdx: number) => {
                const leader = category.leaders?.[0];
                if (!leader) return null;
                const headshot = leader.athlete.headshot;
                const headshotUrl = typeof headshot === 'string' ? headshot : headshot?.href;
                return (
                  <button
                    key={`${category.name}-${categoryIdx}`}
                    onClick={() => navigate(`/nfl/player/${leader.athlete.id}`)}
                    className="flex flex-col items-center text-center hover:bg-[#00ffe7]/5 rounded-lg p-2 transition-all group cursor-pointer bg-[#23263a]/50 border border-[#00ffe7]/10"
                  >
                    {headshotUrl ? (
                      <img
                        src={headshotUrl}
                        alt={leader.athlete.displayName}
                        className="w-16 h-16 rounded-full group-hover:scale-110 transition-transform object-cover mb-2"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-[#23263a] flex items-center justify-center group-hover:scale-110 transition-transform border-2 border-[#00ffe7]/30 mb-2">
                        <FaFootballBall className="text-[#00ffe7]" />
                      </div>
                    )}
                    <p className="text-[#e0e7ef] font-bold text-sm group-hover:text-[#00ffe7] transition-colors truncate w-full">
                      {leader.athlete.shortName || leader.athlete.displayName}
                    </p>
                    <p className="text-[#b0b7bf] text-xs mb-1">{category.shortDisplayName || category.displayName}</p>
                    <p className="text-[#00ffe7] font-bold text-lg">{leader.displayValue}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
     
      {/* Live Game Situation */}
      {competition.situation && competition.status.type.state === 'in' && (
        <div className="space-y-4">
          {/* Football Field Visualization */}
          {competition.situation.lastPlay && (
            <div className="">
              {/* Field Visualization */}
              <div className="pt-2 ">
                <div className='mx-2'>
                  <FootballField
                    homeTeam={homeTeam}
                    awayTeam={awayTeam}
                    lastPlay={competition.situation.lastPlay}
                    situation={competition.situation}
                    getTeamLogo={getTeamLogo}
                  />

                  {/* Play Log */}
                  <div className="mt-4">
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
          )}
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
                      <tr className="border-b border-[#00ffe7]/20">
                        <th className="text-left text-[#b0b7bf] font-semibold py-2">Team</th>
                        {[1, 2, 3, 4].map(q => (
                          <th key={q} className="text-center text-[#b0b7bf] font-semibold py-2">Q{q}</th>
                        ))}
                        {(homeTeam?.linescores?.length ?? 0) > 4 && (
                          <th className="text-center text-[#b0b7bf] font-semibold py-2">OT</th>
                        )}
                        <th className="text-center text-[#b0b7bf] font-semibold py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-[#00ffe7]/10">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <img src={getTeamLogo(awayTeam?.team)} alt={awayTeam?.team.abbreviation} className="w-7 h-6" />
                            <span className="text-[#e0e7ef] font-bold">{awayTeam?.team.abbreviation}</span>
                          </div>
                        </td>
                        {awayTeam?.linescores?.map((score: any, idx: number) => (
                          <td key={idx} className="text-center text-[#e0e7ef] py-3">
                            <CountUpScore value={parseInt(score.displayValue) || 0} duration={800} />
                          </td>
                        ))}
                        <td className="text-center text-[#00ffe7] font-bold py-3">
                          <CountUpScore value={awayTeam?.score || 0} />
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <img src={getTeamLogo(homeTeam?.team)} alt={homeTeam?.team.abbreviation} className="w-7 h-6" />
                            <span className="text-[#e0e7ef] font-bold">{homeTeam?.team.abbreviation}</span>
                          </div>
                        </td>
                        {homeTeam?.linescores?.map((score: any, idx: number) => (
                          <td key={idx} className="text-center text-[#e0e7ef] py-3">
                            <CountUpScore value={parseInt(score.displayValue) || 0} duration={800} />
                          </td>
                        ))}
                        <td className="text-center text-[#faafe8] font-bold py-3">
                          <CountUpScore value={homeTeam?.score || 0} />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
        </div>
      )}

      {/* Head-to-Head Leaders - Condensed */}
      <GameLeaders 
        summary={summary}
        homeTeamId={homeTeam?.id}
        awayTeamId={awayTeam?.id}
      />

      {/* Team Statistics */}
      <div className="mt-6">
        {/* Divider */}
        <div className="border-t-2 border-[#00ffe7]/20 pt-2 mb-4"></div>
        <div className="mx-2">
          <div className="flex items-center mb-6 pb-3 border-b border-[#00ffe7]/10">
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
                <p className="text-[#b0b7bf] text-sm font-semibold">Stat</p>
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
                <div key={`stat-${statIdx}`} className="grid grid-cols-3 gap-4 items-center bg-[#23263a]/50 rounded-lg p-3 border border-[#00ffe7]/10">
                  <div className="text-center">
                    <p className="text-[#00ffe7] font-bold text-lg">
                      {awayStat.displayValue}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[#b0b7bf] text-sm font-semibold">
                      {awayStat.label}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[#00ffe7] font-bold text-lg">
                      {homeStat.displayValue}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-[#b0b7bf] text-center py-8">Team statistics will be available after the game.</p>
        )}
        </div>
      </div>

      {/* Predictions */}
      <div className=" ">
        {/* Divider */}
        <div className="border-t-2 border-[#00ffe7]/20 pt-2 mb-4"></div>
        <div className="mx-2">
          <div className="flex items-center mb-6 pb-3 border-b border-[#00ffe7]/10">
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
    </>
  );
};

export default Info;