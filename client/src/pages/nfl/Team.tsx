import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { FaFootballBall, FaArrowLeft, FaHome, FaRoad, FaTrophy, FaUsers, FaChartLine, FaCalendar, FaMapMarkerAlt, FaStar } from "react-icons/fa";
import type { TeamApiResponse, TeamRecord, NextEvent, Competitor, Leader } from "@/types/espn/team";

const NFLTeam: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [teamData, setTeamData] = useState<TeamApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get leaders from navigation state
  const passedLeaders = (location.state as any)?.leaders as Leader[] | undefined;

  useEffect(() => {
    const fetchTeamData = async () => {
      if (!teamId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${teamId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch team data');
        }
        
        const data: TeamApiResponse = await response.json();
        setTeamData(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [teamId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a1d2e] to-[#16182a] flex items-center justify-center">
        <div className="text-center">
          <FaFootballBall className="text-6xl text-[#00ffe7] mx-auto mb-4 animate-bounce" />
          <p className="text-[#e0e7ef] text-xl">Loading team details...</p>
        </div>
      </div>
    );
  }

  if (error || !teamData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a1d2e] to-[#16182a] flex items-center justify-center">
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-8 text-center max-w-md">
          <p className="text-red-400 font-bold mb-2 text-lg">Error loading team data</p>
          <p className="text-[#e0e7ef] mb-4">{error || 'Team not found'}</p>
          <button
            onClick={() => navigate('/nfl')}
            className="px-6 py-2 bg-[#00ffe7]/20 border border-[#00ffe7]/30 rounded-lg text-[#00ffe7] hover:bg-[#00ffe7]/30 transition-colors"
          >
            Back to Scoreboard
          </button>
        </div>
      </div>
    );
  }

  const { team } = teamData;
  const primaryLogo = team.logos.find((logo) => logo.rel.includes('default') || logo.rel.includes('full'));
  const totalRecord = team.record.items.find((r: TeamRecord) => r.type === 'total');
  const homeRecord = team.record.items.find((r: TeamRecord) => r.type === 'home');
  const awayRecord = team.record.items.find((r: TeamRecord) => r.type === 'road');
  
  // Get stats from total record
  const getStatValue = (statName: string) => {
    const stat = totalRecord?.stats?.find((s) => s.name === statName);
    return stat?.value;
  };

  const nextGame: NextEvent | undefined = team.nextEvent?.[0];
  const nextCompetition = nextGame?.competitions[0];
  const homeTeam = nextCompetition?.competitors.find((c: Competitor) => c.homeAway === 'home');
  const awayTeam = nextCompetition?.competitors.find((c: Competitor) => c.homeAway === 'away');
  
  // Use leaders from navigation state (passed from GameCard as competition.leaders - SEASON data)
  // No fallback needed - if no passed leaders, don't show the section
  const teamLeaders = passedLeaders || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1d2e] to-[#16182a]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Back Button */}
        <button
          onClick={() => navigate('/nfl')}
          className="flex items-center gap-2 px-4 py-2 mb-6 bg-[#23263a]/90 border border-[#00ffe7]/30 rounded-lg text-[#00ffe7] hover:bg-[#00ffe7]/10 transition-all"
        >
          <FaArrowLeft />
          Back to Scoreboard
        </button>

        {/* Team Header */}
        <div className="bg-[#181a23]/90 rounded-xl border border-[#00ffe7]/30 shadow-[0_0_20px_rgba(0,255,231,0.1)] p-8 mb-6">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Team Logo */}
            <div className="relative">
              {primaryLogo && (
                <img
                  src={primaryLogo.href}
                  alt={team.displayName}
                  className="w-48 h-48 object-contain drop-shadow-[0_0_20px_rgba(0,255,231,0.3)]"
                />
              )}
              <div 
                className="absolute inset-0 rounded-full opacity-20 blur-3xl"
                style={{ backgroundColor: `#${team.color}` }}
              />
            </div>

            {/* Team Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-5xl font-bold text-[#00ffe7] mb-2 drop-shadow-[0_0_8px_#00ffe7]">
                {team.displayName}
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-4">
                <span className="text-2xl font-bold text-white">{totalRecord?.summary}</span>
                {team.standingSummary && (
                  <span className="px-4 py-1 bg-[#faafe8]/20 border border-[#faafe8]/30 rounded-full text-[#faafe8] text-sm">
                    {team.standingSummary}
                  </span>
                )}
              </div>

              {/* Record Breakdown */}
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                {homeRecord && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-[#23263a]/50 rounded-lg border border-[#00ffe7]/20">
                    <FaHome className="text-[#00ffe7]" />
                    <div>
                      <div className="text-xs text-gray-400">Home</div>
                      <div className="text-sm font-bold text-white">{homeRecord.summary}</div>
                    </div>
                  </div>
                )}
                {awayRecord && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-[#23263a]/50 rounded-lg border border-[#00ffe7]/20">
                    <FaRoad className="text-[#faafe8]" />
                    <div>
                      <div className="text-xs text-gray-400">Away</div>
                      <div className="text-sm font-bold text-white">{awayRecord.summary}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Points For */}
          <div className="bg-[#181a23]/90 rounded-xl border border-[#00ffe7]/30 p-6">
            <div className="flex items-center gap-3 mb-3">
              <FaChartLine className="text-2xl text-[#00ffe7]" />
              <div className="text-sm text-gray-400">Points For</div>
            </div>
            <div className="text-3xl font-bold text-[#00ffe7]">
              {getStatValue('pointsFor')?.toFixed(0) || 'N/A'}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Avg: {getStatValue('avgPointsFor')?.toFixed(1) || 'N/A'} per game
            </div>
          </div>

          {/* Points Against */}
          <div className="bg-[#181a23]/90 rounded-xl border border-[#faafe8]/30 p-6">
            <div className="flex items-center gap-3 mb-3">
              <FaChartLine className="text-2xl text-[#faafe8]" />
              <div className="text-sm text-gray-400">Points Against</div>
            </div>
            <div className="text-3xl font-bold text-[#faafe8]">
              {getStatValue('pointsAgainst')?.toFixed(0) || 'N/A'}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Avg: {getStatValue('avgPointsAgainst')?.toFixed(1) || 'N/A'} per game
            </div>
          </div>

          {/* Point Differential */}
          <div className="bg-[#181a23]/90 rounded-xl border border-[#00ffe7]/30 p-6">
            <div className="flex items-center gap-3 mb-3">
              <FaTrophy className="text-2xl text-[#00ffe7]" />
              <div className="text-sm text-gray-400">Differential</div>
            </div>
            <div className={`text-3xl font-bold ${(getStatValue('pointDifferential') || 0) >= 0 ? 'text-[#00ffe7]' : 'text-red-400'}`}>
              {(getStatValue('pointDifferential') || 0) >= 0 ? '+' : ''}{getStatValue('pointDifferential')?.toFixed(0) || 'N/A'}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Total differential
            </div>
          </div>

          {/* Streak */}
          <div className="bg-[#181a23]/90 rounded-xl border border-[#faafe8]/30 p-6">
            <div className="flex items-center gap-3 mb-3">
              <FaFootballBall className="text-2xl text-[#faafe8]" />
              <div className="text-sm text-gray-400">Current Streak</div>
            </div>
            <div className={`text-3xl font-bold ${(getStatValue('streak') || 0) >= 0 ? 'text-[#00ffe7]' : 'text-red-400'}`}>
              {(getStatValue('streak') || 0) >= 0 ? 'W' : 'L'}{Math.abs(getStatValue('streak') || 0)}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {(getStatValue('streak') || 0) >= 0 ? 'Winning' : 'Losing'} streak
            </div>
          </div>
        </div>

        {/* Division Stats */}
        <div className="bg-[#181a23]/90 rounded-xl border border-[#00ffe7]/30 shadow-[0_0_20px_rgba(0,255,231,0.1)] p-6 mb-6">
          <h2 className="text-2xl font-bold text-[#00ffe7] mb-4 flex items-center gap-2">
            <FaUsers />
            Division Performance
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-[#23263a]/50 rounded-lg">
              <div className="text-sm text-gray-400 mb-1">Division Record</div>
              <div className="text-2xl font-bold text-white">
                {getStatValue('divisionWins')?.toFixed(0)}-{getStatValue('divisionLosses')?.toFixed(0)}
              </div>
            </div>
            <div className="text-center p-4 bg-[#23263a]/50 rounded-lg">
              <div className="text-sm text-gray-400 mb-1">Division Win %</div>
              <div className="text-2xl font-bold text-[#00ffe7]">
                {((getStatValue('divisionWinPercent') || 0) * 100).toFixed(1)}%
              </div>
            </div>
            <div className="text-center p-4 bg-[#23263a]/50 rounded-lg">
              <div className="text-sm text-gray-400 mb-1">Games Played</div>
              <div className="text-2xl font-bold text-white">
                {getStatValue('gamesPlayed')?.toFixed(0) || 'N/A'}
              </div>
            </div>
            <div className="text-center p-4 bg-[#23263a]/50 rounded-lg">
              <div className="text-sm text-gray-400 mb-1">Playoff Seed</div>
              <div className="text-2xl font-bold text-[#faafe8]">
                #{getStatValue('playoffSeed')?.toFixed(0) || 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Next Game */}
        {nextGame && (
          <div className="bg-[#181a23]/90 rounded-xl border border-[#faafe8]/30 shadow-[0_0_20px_rgba(250,175,232,0.1)] p-6">
            <h2 className="text-2xl font-bold text-[#faafe8] mb-4 flex items-center gap-2">
              <FaCalendar />
              {nextCompetition?.status.type.completed ? 'Last Game' : 'Next Game'}
            </h2>
            
            <div className="bg-[#23263a]/50 rounded-lg p-6">
              <div className="text-center mb-4">
                <div className="text-sm text-gray-400 mb-1">
                  {new Date(nextGame.date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
                <div className="text-lg font-bold text-[#00ffe7]">
                  {nextGame.name}
                </div>
              </div>

              <div className="flex items-center justify-center gap-8">
                {/* Away Team */}
                {awayTeam && (
                  <div className="flex flex-col items-center">
                    <img
                      src={awayTeam.team.logos[0]?.href}
                      alt={awayTeam.team.displayName}
                      className="w-24 h-24 object-contain mb-2"
                    />
                    <div className="text-lg font-bold text-white">{awayTeam.team.abbreviation}</div>
                    {awayTeam.score && (
                      <div className="text-3xl font-bold text-[#00ffe7] mt-2">
                        {awayTeam.score.displayValue}
                      </div>
                    )}
                  </div>
                )}

                {/* VS or @ */}
                <div className="text-2xl font-bold text-gray-400">
                  @
                </div>

                {/* Home Team */}
                {homeTeam && (
                  <div className="flex flex-col items-center">
                    <img
                      src={homeTeam.team.logos[0]?.href}
                      alt={homeTeam.team.displayName}
                      className="w-24 h-24 object-contain mb-2"
                    />
                    <div className="text-lg font-bold text-white">{homeTeam.team.abbreviation}</div>
                    {homeTeam.score && (
                      <div className="text-3xl font-bold text-[#00ffe7] mt-2">
                        {homeTeam.score.displayValue}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Game Status */}
              <div className="text-center mt-4">
                <span className="px-4 py-2 bg-[#00ffe7]/20 border border-[#00ffe7]/30 rounded-full text-[#00ffe7] text-sm font-bold">
                  {nextCompetition?.status.type.description || 'Scheduled'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Team Season Leaders */}
        {teamLeaders.length > 0 && (
          <div className="bg-[#181a23]/90 rounded-xl border border-[#00ffe7]/30 shadow-[0_0_20px_rgba(0,255,231,0.1)] p-6 mb-6">
            <h2 className="text-2xl font-bold text-[#00ffe7] mb-6 flex items-center gap-2">
              <FaStar />
              Season Leaders
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamLeaders.map((leader: Leader, idx: number) => {
                const topLeader = leader.leaders?.[0];
                if (!topLeader) return null;
                
                return (
                  <div 
                    key={idx} 
                    className="bg-gradient-to-br from-[#23263a]/80 to-[#181a23]/80 rounded-xl border border-[#00ffe7]/20 p-5 hover:border-[#00ffe7]/40 transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,255,231,0.2)]"
                  >
                    {/* Category Badge */}
                    <div className="mb-4">
                      <span className="inline-block px-4 py-1.5 bg-[#00ffe7]/20 border border-[#00ffe7]/40 rounded-full text-[#00ffe7] text-xs font-bold uppercase tracking-wider">
                        {leader.displayName}
                      </span>
                    </div>
                    
                    {/* Player Info */}
                    <div className="flex items-center gap-3 mb-3">
                      {topLeader.athlete.headshot ? (
                        <img 
                          src={topLeader.athlete.headshot}
                          alt={topLeader.athlete.displayName}
                          className="w-16 h-16 rounded-full object-cover border-2 border-[#faafe8]/30 flex-shrink-0 cursor-pointer hover:scale-110 transition-transform"
                          onClick={() => navigate(`/nfl/player/${topLeader.athlete.id}`)}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className="w-16 h-16 rounded-full bg-[#23263a] border-2 border-[#faafe8]/30 flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer hover:scale-110 transition-transform"
                        style={{ display: topLeader.athlete.headshot ? 'none' : 'flex' }}
                        onClick={() => navigate(`/nfl/player/${topLeader.athlete.id}`)}
                      >
                        <FaFootballBall className="text-[#faafe8] text-2xl" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div 
                          className="text-lg font-bold text-white truncate cursor-pointer hover:text-[#00ffe7] transition-colors"
                          onClick={() => navigate(`/nfl/player/${topLeader.athlete.id}`)}
                        >
                          {topLeader.athlete.displayName}
                        </div>
                        <div className="text-sm text-gray-400">
                          {leader.abbreviation}
                        </div>
                      </div>
                    </div>
                    
                    {/* Stats Value */}
                    <div className="pt-3 border-t border-[#faafe8]/20">
                      <div className="text-3xl font-bold text-[#faafe8] text-center">
                        {topLeader.displayValue}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stadium Information */}
        {team.franchise?.venue && (
          <div className="bg-[#181a23]/90 rounded-xl border border-[#00ffe7]/30 shadow-[0_0_20px_rgba(0,255,231,0.1)] p-6 mb-6">
            <h2 className="text-2xl font-bold text-[#00ffe7] mb-4 flex items-center gap-2">
              <FaMapMarkerAlt />
              Stadium Information
            </h2>
            <div className="bg-[#23263a]/50 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Venue</div>
                  <div className="text-xl font-bold text-white">{team.franchise.venue.fullName}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Location</div>
                  <div className="text-xl font-bold text-white">
                    {team.franchise.venue.address.city}, {team.franchise.venue.address.state}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Surface</div>
                  <div className="text-lg font-bold text-[#00ffe7]">
                    {team.franchise.venue.grass ? 'Natural Grass' : 'Artificial Turf'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Type</div>
                  <div className="text-lg font-bold text-[#00ffe7]">
                    {team.franchise.venue.indoor ? 'Indoor Stadium' : 'Outdoor Stadium'}
                  </div>
                </div>
              </div>
              
              {/* Stadium Images */}
              {team.franchise.venue.images && team.franchise.venue.images.length > 0 && (
                <div className="mt-6">
                  <img
                    src={team.franchise.venue.images[0].href}
                    alt={team.franchise.venue.fullName}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default NFLTeam;