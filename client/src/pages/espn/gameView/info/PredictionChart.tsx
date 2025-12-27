import React, { useState, useEffect } from "react";
import { FaPercent, FaTimes } from "react-icons/fa";
import axios from "axios";
import { useLeague } from "@/providers/LeagueContext";
import { getPredictorUrl } from "@/utils/espnApi";

interface Statistic {
  name: string;
  displayName: string;
  shortDisplayName: string;
  description: string;
  abbreviation: string;
  value: number;
  displayValue: string;
}

interface TeamPrediction {
  team: {
    $ref: string;
  };
  statistics: Statistic[];
}

interface PredictionData {
  name: string;
  shortName: string;
  homeTeam: TeamPrediction;
  awayTeam: TeamPrediction;
}

interface PredictionProps {
  gameId: string;
  competitionId: string;
  homeTeamInfo: { name: string; logo: string; color: string };
  awayTeamInfo: { name: string; logo: string; color: string };
  getTeamLogo: (team: any) => string;
  homeTeam: any;
  awayTeam: any;
}

const PredictionChart: React.FC<PredictionProps> = ({ gameId, competitionId, homeTeamInfo, awayTeamInfo, getTeamLogo, homeTeam, awayTeam }) => {
  const { league } = useLeague();
  const [data, setData] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(
          getPredictorUrl(league, gameId, competitionId)
        );

        // console.log('Predictor API response:', response.data);
        
        // Validate that we have the expected structure
        if (!response.data || !response.data.homeTeam || !response.data.awayTeam) {
          throw new Error('Invalid predictor data structure');
        }
        
        // Ensure at least one team has statistics (NBA sometimes only has awayTeam stats)
        const hasHomeStats = response.data.homeTeam.statistics && Array.isArray(response.data.homeTeam.statistics);
        const hasAwayStats = response.data.awayTeam.statistics && Array.isArray(response.data.awayTeam.statistics);
        
        if (!hasHomeStats && !hasAwayStats) {
          throw new Error('Statistics data not available');
        }

        setData(response.data);
      } catch (err) {
        console.error('Failed to fetch prediction:', err);
        setError('Prediction data not available for this game');
      } finally {
        setLoading(false);
      }
    };

    fetchPrediction();
  }, [gameId, competitionId, league]);

  if (loading) {
    return (
      <div className="bg-bg-dark/95 rounded-xl border border-neon-cyan/30 p-6 text-center">
        <p className="text-neon-cyan">Loading prediction data...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-bg-dark/95 rounded-xl border border-neon-cyan/30 p-6 text-center">
        <p className="text-gray-400">{error || 'No prediction data available'}</p>
      </div>
    );
  }

  // Extract key statistics - silently returns N/A if stat doesn't exist
  const getStatValue = (stats: Statistic[] | undefined, statName: string): string => {
    if (!stats || !Array.isArray(stats)) {
      return "N/A";
    }
    const stat = stats.find(s => s.name === statName);
    return stat?.displayValue || "N/A";
  };

  const getNumericStatValue = (stats: Statistic[] | undefined, statName: string): number | null => {
    if (!stats || !Array.isArray(stats)) {
      return null;
    }
    const stat = stats.find(s => s.name === statName);
    return stat ? parseFloat(stat.value.toString()) : null;
  };

  // NBA only provides awayTeam statistics - calculate home team as complement
  const hasHomeStats = data.homeTeam?.statistics && Array.isArray(data.homeTeam.statistics);
  const hasAwayStats = data.awayTeam?.statistics && Array.isArray(data.awayTeam.statistics);

  // Win probabilities
  const awayWinProbValue = getNumericStatValue(data.awayTeam?.statistics, "gameProjection");
  const homeWinProbValue = hasHomeStats 
    ? getNumericStatValue(data.homeTeam?.statistics, "gameProjection")
    : (awayWinProbValue !== null ? 100 - awayWinProbValue : null);
  
  const homeWinProb = homeWinProbValue !== null ? homeWinProbValue.toFixed(1) : "N/A";
  const awayWinProb = awayWinProbValue !== null ? awayWinProbValue.toFixed(1) : "N/A";

  // Matchup quality (same for both teams)
  const matchupQuality = getStatValue(data.awayTeam?.statistics || data.homeTeam?.statistics, "matchupQuality");

  // Point differentials
  const awayPredPtDiffValue = getNumericStatValue(data.awayTeam?.statistics, "teamPredPtDiff");
  const homePredPtDiffValue = hasHomeStats
    ? getNumericStatValue(data.homeTeam?.statistics, "teamPredPtDiff")
    : (awayPredPtDiffValue !== null ? -awayPredPtDiffValue : null);
  
  const homePredPtDiff = homePredPtDiffValue !== null ? homePredPtDiffValue.toFixed(3) : "N/A";
  const awayPredPtDiff = awayPredPtDiffValue !== null ? awayPredPtDiffValue.toFixed(3) : "N/A";
  
  // NFL-specific stats (only available when both teams have stats)
  const homeOffEff = getStatValue(data.homeTeam?.statistics, "teamOffEff");
  const awayOffEff = getStatValue(data.awayTeam?.statistics, "teamOffEff");
  const homeDefEff = getStatValue(data.homeTeam?.statistics, "teamDefEff");
  const awayDefEff = getStatValue(data.awayTeam?.statistics, "teamDefEff");
  const homeTotalEff = getStatValue(data.homeTeam?.statistics, "teamTotEff");
  const awayTotalEff = getStatValue(data.awayTeam?.statistics, "teamTotEff");
  
  // NBA-specific stats - home team values are inverse of away team
  const awayExpectedPtsValue = getNumericStatValue(data.awayTeam?.statistics, "teamExpectedPts");
  const awayOppExpectedPtsValue = getNumericStatValue(data.awayTeam?.statistics, "oppExpectedPts");
  
  const homeExpectedPts = hasHomeStats
    ? getStatValue(data.homeTeam?.statistics, "teamExpectedPts")
    : (awayOppExpectedPtsValue !== null ? awayOppExpectedPtsValue.toFixed(3) : "N/A");
  const awayExpectedPts = awayExpectedPtsValue !== null ? awayExpectedPtsValue.toFixed(3) : "N/A";
  
  const homeOppExpectedPts = hasHomeStats
    ? getStatValue(data.homeTeam?.statistics, "oppExpectedPts")
    : (awayExpectedPtsValue !== null ? awayExpectedPtsValue.toFixed(3) : "N/A");
  const awayOppExpectedPts = awayOppExpectedPtsValue !== null ? awayOppExpectedPtsValue.toFixed(3) : "N/A";

  return (
    <div className="bg-bg-dark/95 rounded-xl py-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2">
          <FaPercent className="text-neon-cyan text-lg sm:text-xl" />
          <h3 className="text-base sm:text-lg font-bold text-neon-cyan">Game Prediction</h3>
        </div>
      </div>

      {/* Win Probability */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <img src={getTeamLogo(awayTeam)} alt={awayTeamInfo.name} className="w-8 h-8 object-contain" />
            <span className="text-sm font-semibold text-text-light">{awayTeamInfo.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-text-light">{homeTeamInfo.name}</span>
            <img src={getTeamLogo(homeTeam)} alt={homeTeamInfo.name} className="w-8 h-8 object-contain" />
          </div>
        </div>

        {/* Win Probability Bar */}
        <div className="relative h-12 bg-bg-darker rounded-lg overflow-hidden mb-2">
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-neon-pink/60 to-neon-pink/40 transition-all duration-500"
            style={{ width: `${awayWinProb}%` }}
          />
          <div
            className="absolute right-0 top-0 h-full bg-gradient-to-l from-neon-cyan/60 to-neon-cyan/40 transition-all duration-500"
            style={{ width: `${homeWinProb}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-between px-4">
            <span className="text-lg font-bold text-white z-10">{awayWinProb}%</span>
            <span className="text-xs text-gray-300 font-semibold">WIN PROBABILITY</span>
            <span className="text-lg font-bold text-white z-10">{homeWinProb}%</span>
          </div>
        </div>

        {/* Matchup Quality */}
        <div className="text-center">
          <span className="text-xs text-gray-400">Matchup Quality: </span>
          <span className="text-sm font-bold text-neon-pink">{matchupQuality}/100</span>
        </div>
      </div>

      {/* Predicted Point Differential */}
      <div className="mb-6 p-3 bg-bg-darker/50 rounded-lg">
        <div className="text-xs text-gray-400 font-bold uppercase mb-2 text-center">Predicted Point Differential</div>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-neon-pink">{awayPredPtDiff}</div>
            <div className="text-xs text-gray-400">{awayTeamInfo.name}</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-neon-cyan">{homePredPtDiff}</div>
            <div className="text-xs text-gray-400">{homeTeamInfo.name}</div>
          </div>
        </div>
      </div>

      {/* Team Stats - Different for NBA vs NFL */}
      {league === 'nfl' ? (
        // NFL: Show Efficiency Ratings
        <div className="space-y-3">
          <div className="text-xs text-gray-400 font-bold uppercase text-center mb-3">Team Efficiency Ratings</div>
          
          {/* Total Efficiency */}
          <div className="p-3 bg-bg-darker/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">Total Efficiency</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-xl font-bold text-neon-pink">{awayTotalEff}</div>
              </div>
              <div>
                <div className="text-xl font-bold text-neon-cyan">{homeTotalEff}</div>
              </div>
            </div>
          </div>

          {/* Offensive Efficiency */}
          <div className="p-3 bg-bg-darker/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">Offensive Efficiency</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-neon-pink">{awayOffEff}</div>
              </div>
              <div>
                <div className="text-lg font-bold text-neon-cyan">{homeOffEff}</div>
              </div>
            </div>
          </div>

          {/* Defensive Efficiency */}
          <div className="p-3 bg-bg-darker/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">Defensive Efficiency</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-neon-pink">{awayDefEff}</div>
              </div>
              <div>
                <div className="text-lg font-bold text-neon-cyan">{homeDefEff}</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // NBA: Show Expected Points
        <div className="space-y-3">
          <div className="text-xs text-gray-400 font-bold uppercase text-center mb-3">Expected Points</div>
          
          {/* Team Expected Points */}
          <div className="p-3 bg-bg-darker/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">Team Expected Points</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-xl font-bold text-neon-pink">{awayExpectedPts}</div>
                <div className="text-xs text-gray-500 mt-1">{awayTeamInfo.name}</div>
              </div>
              <div>
                <div className="text-xl font-bold text-neon-cyan">{homeExpectedPts}</div>
                <div className="text-xs text-gray-500 mt-1">{homeTeamInfo.name}</div>
              </div>
            </div>
          </div>

          {/* Opponent Expected Points (Defense) */}
          <div className="p-3 bg-bg-darker/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">Opponent Expected Points</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-neon-pink">{awayOppExpectedPts}</div>
                <div className="text-xs text-gray-500 mt-1">vs {homeTeamInfo.name}</div>
              </div>
              <div>
                <div className="text-lg font-bold text-neon-cyan">{homeOppExpectedPts}</div>
                <div className="text-xs text-gray-500 mt-1">vs {awayTeamInfo.name}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Note */}
      <div className="mt-4 pt-4 border-t border-neon-pink/20">
        <p className="text-xs text-gray-500 text-center">
          Predictions powered by ESPN Analytics
        </p>
      </div>
    </div>
  );
};

export default PredictionChart;
