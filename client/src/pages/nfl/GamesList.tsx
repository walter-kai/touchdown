import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FaFootballBall, FaPlay, FaCalendar, FaChevronLeft, FaChevronRight, FaMapMarkerAlt } from "react-icons/fa";
import LoadingFootball from '../../components/common/LoadingFootball';
import NewsTicker from '../../components/nfl/NewsTicker';
import { useScoreboard } from '../../providers/ScoreboardContext';
import type {
  Event,
  Competitor
} from '@/types/espn/scoreboard';

const NFLScoreboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    games,
    news,
    byeTeams,
    weekNumber,
    selectedWeek,
    initialLoading,
    error,
    handlePreviousWeek,
    handleNextWeek,
  } = useScoreboard();

  // Helper function to group games by date with time information preserved
  const groupGamesByDate = (gamesList: Event[]) => {
    const grouped = gamesList.reduce((acc, game) => {
      const dateKey = new Date(game.date).toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      
      // Add time to each game object
      const timeKey = new Date(game.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      acc[dateKey].push({ ...game, timeKey });
      
      return acc;
    }, {} as Record<string, Array<Event & { timeKey: string }>>);
    
    return grouped;
  };

  // Categorize and sort games
  const { liveGames, completedGames, upcomingGames } = useMemo(() => {
    const live = games.filter(game => game.status.type.state === 'in');
    const completed = games
      .filter(game => game.status.type.completed)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort by date descending (most recent first)
    const upcoming = games.filter(game => game.status.type.state === 'pre');
    
    return { liveGames: live, completedGames: completed, upcomingGames: upcoming };
  }, [games]);

  return (
  <>
  <div className="max-w-7xl mx-auto py-2">
	
  {/* Week Navigation */}
		<div className="bg-[#181a23]/50 rounded-lg p-2 mb-6 mx-2">
			<div className="flex items-center justify-between gap-2">
				<button
					onClick={handlePreviousWeek}
					disabled={!selectedWeek || selectedWeek <= 1}
					className="btn-purple flex items-center gap-2 h-12 w-48"
				>
					<FaChevronLeft />
					Last
				</button>
				
				<h1 className="w-full text-center pt-2 mx-2">
					Week {selectedWeek || weekNumber || '...'}
				</h1>
				
				<button
					onClick={handleNextWeek}
					disabled={!selectedWeek || selectedWeek >= 18}
					className="btn-purple flex items-center gap-2 h-12 w-48"
				>
					Next
					<FaChevronRight />
				</button>
			</div>

		</div>


  {/* Teams on Bye - Ticker Banner */}
  {byeTeams.length > 0 && (
    <div className="mb-6 bg-[#181a23]/90 rounded-lg border border-[#faafe8]/30 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2">
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm font-bold text-[#faafe8]">TEAMS ON BYE:</span>
        </div>
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide flex-1">
          {byeTeams.map((team) => (
            <button
              key={team.id}
              onClick={() => navigate(`/nfl/team/${team.id}`)}
              className="flex items-center gap-2 bg-[#23263a]/50 hover:bg-[#23263a] border border-[#faafe8]/20 hover:border-[#faafe8]/50 rounded px-3 py-1 transition-all flex-shrink-0"
            >
              {team.logo && <img src={team.logo} alt={team.displayName} className="w-5 h-5" />}
              <span className="text-white text-xs font-semibold">{team.abbreviation}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )}

  {/* News Ticker - Moved to Top */}
  <NewsTicker news={news} />

  {/* Loading State */}
	{initialLoading && games.length === 0 && <LoadingFootball message="Loading NFL scores..." />}

  {/* Error State */}
	{error && (
		<div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 sm:p-5 md:p-6 text-center">
		<p className="text-red-400 font-bold mb-2 text-sm sm:text-base">Error loading data</p>
		<p className="text-[#e0e7ef] text-xs sm:text-sm">{error}</p>
		</div>
	)}

  {/* Games Grid */}
	{!initialLoading && games.length > 0 && (
		<div className="space-y-8">
			{/* Live Games */}
			{liveGames.length > 0 && (
			<div>
				<h1 className="flex items-center gap-2 mx-2 mb-4">
				Live Now ({liveGames.length})
				</h1>
				{Object.entries(groupGamesByDate(liveGames)).map(([date, gamesWithTime]) => (
					<div key={date} className="mb-6">
						<h2 className="text-lg font-semibold text-[#00ffe7] mx-2 mb-3 text-left">{date}</h2>
						<div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 px-2">
							{gamesWithTime.map((game) => (
								<GameGridCard key={game.id} game={game} navigate={navigate} />
							))}
						</div>
					</div>
				))}
			</div>
			)}

      {/* Upcoming Games */}
			{upcomingGames.length > 0 && (
			<div>
				<h1 className="flex items-center gap-2 mx-2 mb-4">
				Upcoming ({upcomingGames.length})
				</h1>
				{Object.entries(groupGamesByDate(upcomingGames)).map(([date, gamesWithTime]) => (
					<div key={date} className="mb-6">
						<h2 className="text-lg font-semibold text-[#00ffe7] mx-2 mb-3 text-left">{date}</h2>
						<div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 px-2">
							{gamesWithTime.map((game) => (
								<GameGridCard key={game.id} game={game} navigate={navigate} />
							))}
						</div>
					</div>
				))}
			</div>
			)}
			
			{/* Completed Games */}
			{completedGames.length > 0 && (
			<div>
				<h1 className="flex items-center gap-2 mx-2 mb-4">
				Final ({completedGames.length})
				</h1>
				{Object.entries(groupGamesByDate(completedGames)).map(([date, gamesWithTime]) => (
					<div key={date} className="mb-6">
						<h2 className="text-lg font-semibold text-[#00ffe7] mx-2 mb-3 text-left">{date}</h2>
						<div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 px-2">
							{gamesWithTime.map((game) => (
								<GameGridCard key={game.id} game={game} navigate={navigate} />
							))}
						</div>
					</div>
				))}
			</div>
			)}
			
		</div>
	)}

  {/* No Games */}
	{!initialLoading && games.length === 0 && !error && (
		<div className="text-center py-12 sm:py-16 md:py-20">
		<FaFootballBall className="text-4xl sm:text-5xl md:text-6xl text-[#faafe8] mx-auto mb-3 sm:mb-4" />
		<p className="text-[#e0e7ef] text-base sm:text-lg md:text-xl">No games scheduled at this time</p>
		</div>
	)}

  </div>
  </>
  );
};

// Game Grid Card Component
interface GameGridCardProps {
  game: Event & { timeKey?: string };
  navigate: (path: string) => void;
}

const GameGridCard: React.FC<GameGridCardProps> = ({ game, navigate }) => {
  const competition = game.competitions[0];
  const awayTeam = competition.competitors.find((c: Competitor) => c.homeAway === 'away');
  const homeTeam = competition.competitors.find((c: Competitor) => c.homeAway === 'home');
  
  if (!awayTeam || !homeTeam) return null;

  const isLive = competition.status.type.state === 'in';
  const isFinal = competition.status.type.completed;
  const isPre = competition.status.type.state === 'pre';

  return (
    <button
      onClick={() => navigate(`/nfl/game/${game.id}`)}
      className="relative rounded-md border border-[#faafe8]/20  bg-[#181a23]/50 hover:bg-[#181a23]/70 p-3 px-4 transition-all duration-200 text-left w-full"
    >
      {/* Time Header */}
      {game.timeKey && (
        <div className="text-xs text-gray-400 mb-2 font-medium">{game.timeKey}</div>
      )}

      {/* Live Badge */}
      {isLive && (
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-[#00ffe7]/20 border border-[#00ffe7]/50 rounded-full">
          <FaPlay className="text-[10px] text-[#00ffe7] animate-pulse" />
          <span className="text-xs font-bold text-[#00ffe7]">LIVE</span>
        </div>
      )}

      {/* Game Time/Status */}
      {isLive && (
        <div className="text-center mb-3">
          <div className="text-sm text-[#00ffe7] font-bold">
            Q{competition.status.period} - {competition.status.displayClock}
          </div>
        </div>
      )}

      {/* Teams */}
      <div>
        {/* Away Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <img 
              src={awayTeam.team.logo} 
              alt={awayTeam.team.displayName}
              className="w-10 h-10 object-contain"
            />
            <div className="flex items-center gap-2">
              <div className={`font-bold ${awayTeam.winner ? 'text-[#00ffe7]' : 'text-white'}`}>
                {awayTeam.team.abbreviation}
              </div>
              <div className="text-xs text-gray-400">
                {awayTeam.records?.find((r: any) => r.type === 'total')?.summary || ''}
              </div>
            </div>
          </div>
          <div className={`text-2xl font-bold ${awayTeam.winner ? 'text-[#00ffe7]' : 'text-white'}`}>
            {awayTeam.score || '0'}
          </div>
        </div>

        {/* Home Team */}
        <div className="flex items-center justify-between space-y-2">
          <div className="flex items-center gap-3 flex-1">
            <img 
              src={homeTeam.team.logo} 
              alt={homeTeam.team.displayName}
              className="w-10 h-10 object-contain"
            />
            <div className="flex items-center gap-2">
              <div className={`font-bold ${homeTeam.winner ? 'text-[#00ffe7]' : 'text-white'}`}>
                {homeTeam.team.abbreviation}
              </div>
              <div className="text-xs text-gray-400">
                {homeTeam.records?.find((r: any) => r.type === 'total')?.summary || ''}
              </div>
            </div>
          </div>
          <div className={`text-2xl font-bold ${homeTeam.winner ? 'text-[#00ffe7]' : 'text-white'}`}>
            {homeTeam.score || '0'}
          </div>
        </div>
      </div>

    </button>
  );
};

export default NFLScoreboard;
