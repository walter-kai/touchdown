import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FootballField from '@/views/espn/scoreboard/visuals/FootballField';
import BasketballCourt from '@/views/espn/scoreboard/visuals/BasketballCourt';
import Info from '@/pages/espn/scoreboard/Info';
import { useLoading } from '@/providers/LoadingContext';
import { fetchEspnPlays } from '@/utils/espnPlays';
import { getScoreboardUrl, getSummaryUrl } from '@/utils/espnApi';
import { getHeadshotUrl as getHeadshotUrlUtil } from '@/utils/espnImages';
import type { Event, ScoreboardResponse } from '@/types/espn/scoreboard';
import type { Summary } from '@/types/espn/summary';
import { PlayNfl, PlayNba, Play } from '@/types/espn/plays';

const TestAnimation: React.FC = () => {
  const { showLoading, hideLoading } = useLoading();
  const inputRef = React.useRef<HTMLInputElement>(null);
  
  // Derive league from URL path
  const urlLeague = window.location.pathname.startsWith('/nba') ? 'nba' : 'nfl';
  const league = urlLeague;
  
  // Test mode controls - league-aware default game IDs
  const isNba = league === 'nba';
  const isNfl = league === 'nfl';
  const defaultTestGameId = league === 'nba' ? '401810277' : '401772804';
  const [testGameId, setTestGameId] = useState<string>(defaultTestGameId);
  const [selectedPlayIndex, setSelectedPlayIndex] = useState<number>(0);
  const [event, setEvent] = useState<Event | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [playLog, setPlayLog] = useState<Play[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Update testGameId when league changes
  useEffect(() => {
    setTestGameId(isNba ? '401810277' : '401772804');
  }, [league]);

  // Fetch game data
  useEffect(() => {
    const fetchGameData = async () => {
      try {
        showLoading('Loading test game data...');
        setError(null);

         let summaryData: Summary;

         // If testGameId is "test", load from JSON file
         if (testGameId === 'test') {
           const jsonPath = league === 'nba' 
             ? '/espn/nbascoreboard with dates.json'
             : '/espn/nflscoreboard.json'; // Adjust path for NFL if needed
         
           const response = await fetch(jsonPath);
           if (!response.ok) {
             throw new Error(`Failed to load test data from ${jsonPath}`);
           }
           const jsonData = await response.json();
           summaryData = jsonData;
         } else {
           // Fetch summary from API
           const summaryResponse = await axios.get<Summary>(getSummaryUrl(league, testGameId));
           summaryData = summaryResponse.data;
         }

        setSummary(summaryData);

        // Extract event from summary header
        if (summaryData.header) {
          setEvent(summaryData.header as any);
        } else {
          setError('Game data not found in summary');
          return;
        }

        // Fetch play-by-play
        const compId = (summaryData.header as any)?.competitions?.[0]?.id || testGameId;
        const plays = await fetchEspnPlays(
          testGameId,
          String(compId),
          undefined,
          league,
          (opts) => getHeadshotUrlUtil(opts, league as 'nfl' | 'nba')
        );
        setPlayLog(plays);
      } catch (err: any) {
        console.error('Error loading test game:', err);
        setError(err?.message || 'Failed to load game data');
      } finally {
        hideLoading();
      }
    };

    if (testGameId) {
      fetchGameData();
    }
  }, [testGameId, league, showLoading, hideLoading]);

  // Helper function to get logo URL
  const getTeamLogo = (team: any): string => {
    if (team?.logo) return team.logo;
    if (team?.logos?.[0]?.href) return team.logos[0].href;
    if (team?.team?.logo) return team.team.logo;
    if (team?.team?.logos?.[0]?.href) return team.team.logos[0].href;
    return '';
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-bg-darkest to-bg-card flex items-center justify-center pb-20">
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-8 text-center max-w-md">
          <p className="text-red-400 font-bold mb-2 text-lg">Error loading game</p>
          <p className="text-text-light">{error}</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return null; // Loading state
  }

  const competition = event.competitions[0];
  const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
  const awayTeam = competition.competitors.find(c => c.homeAway === 'away');
  const selectedPlay = playLog[selectedPlayIndex];

  // Build situation object for selected play
  const selectedNbaPlay = isNba ? (selectedPlay as PlayNba | undefined) : undefined;
  const selectedNflPlay = isNfl ? (selectedPlay as PlayNfl | undefined) : undefined;

  // Build situation object for NFL plays only
  const situation = isNfl && selectedNflPlay ? {
    downDistanceText: competition.situation?.downDistanceText,
    possession: selectedNflPlay.possession,
    awayTimeouts: competition.situation?.awayTimeouts,
    homeTimeouts: competition.situation?.homeTimeouts,
    yardLine: selectedNflPlay.yardLine ?? selectedNflPlay.start?.yardLine ?? selectedNflPlay.end?.yardLine,
    lastPlay: {
      possession: selectedNflPlay.possession
    }
  } : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-b from-bg-darkest to-bg-card pb-20">
      {/* Test Controls */}
      <div className="sticky top-14 z-40 bg-bg-darkest border-b-2 border-neon-cyan shadow-lg">
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-text-muted text-xs mb-1 block">Test Game ID ({league.toUpperCase()})</label>
              <input
                ref={inputRef}
                type="text"
                defaultValue={testGameId}
                className="w-full bg-bg-darker text-white px-4 py-2 rounded border border-neon-cyan/30 focus:border-neon-cyan outline-none"
                placeholder="Enter ESPN Game ID"
              />
            </div>
            <button
              onClick={() => {
                if (inputRef.current?.value) {
                  setTestGameId(inputRef.current.value);
                }
              }}
              className="px-6 py-2 bg-neon-cyan text-bg-darkest font-bold rounded hover:bg-neon-cyan/80 transition-colors mt-5"
            >
              Load Game
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
                {/* Field/Court Visualization with Play Selector */}
        {playLog.length > 0 && (
          <div className="p-4">
            <div className="bg-bg-dark/50 rounded-lg p-4 border border-neon-cyan/20">
              <h3 className="text-neon-cyan font-bold text-lg mb-4">
                {league === 'nba' ? 'Court Visualization' : 'Field Animation'}
              </h3>
              
              {/* Play Selector */}
              <div className="mb-4">
                <label className="block text-text-muted text-sm mb-2">
                  Select Play to Visualize ({playLog.length} plays)
                </label>
                <select
                  value={selectedPlayIndex}
                  onChange={(e) => setSelectedPlayIndex(Number(e.target.value))}
                  className="w-full bg-bg-darkest border border-neon-cyan/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-neon-cyan"
                >
                  {playLog.map((play, index) => (
                    <option key={play.id || index} value={index}>
                      Q{(play as any)?.quarter || (play as any)?.period?.number || '?'} {(typeof play.clock === 'string' ? play.clock : (play.clock as any)?.displayValue) || ''} - {typeof play.type === 'string' ? play.type : (play.type as any)?.text || 'Play'} - {(play.text ?? '').substring(0, 80)}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Render Field or Court based on league */}
              {isNba ? (
                <BasketballCourt
                  homeTeam={homeTeam}
                  awayTeam={awayTeam}
                  lastPlay={selectedNbaPlay}
                  playLog={playLog as PlayNba[]}
                  getTeamLogo={getTeamLogo}
                  showGameInfo={true}
                  // showDiagnostics={true}
                />
              ) : (
                <FootballField
                  homeTeam={homeTeam}
                  awayTeam={awayTeam}
                  leftTeamOverride={(selectedNflPlay?.quarter ?? competition.status?.period ?? 1) >= 3 ? homeTeam : awayTeam}
                  rightTeamOverride={(selectedNflPlay?.quarter ?? competition.status?.period ?? 1) >= 3 ? awayTeam : homeTeam}
                  lastPlay={selectedNflPlay ? {
                    id: selectedNflPlay.id,
                    text: selectedNflPlay.text,
                    possession: selectedNflPlay.possession,
                    start: selectedNflPlay.start,
                    end: selectedNflPlay.end,
                    type: typeof selectedNflPlay.type === 'string' ? { text: selectedNflPlay.type } : selectedNflPlay.type,
                    team: selectedNflPlay.team ? { id: selectedNflPlay.team } : undefined,
                    athletesInvolved: selectedNflPlay.athletesInvolved
                  } : undefined}
                  situation={situation}
                  playLog={playLog as PlayNfl[]}
                  getTeamLogo={getTeamLogo}
                  showGameInfo={true}
                />
              )}
            </div>
          </div>
        )}
        {/* Info Section */}
        <div className="p-4">
          <Info
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            competition={competition}
            getTeamLogo={getTeamLogo}
            playLog={playLog as PlayNfl[]}
            summary={summary}
            gameId={testGameId}
          />
        </div>
      </div>
    </div>
  );
};

export default TestAnimation;
