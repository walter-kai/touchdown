import React from 'react';

interface TeamSelectorProps {
  homeTeamInfo: {
    name: string;
    logo: string;
  };
  awayTeamInfo: {
    name: string;
    logo: string;
  };
  activeTeam: 'home' | 'away';
  onTeamChange: (team: 'home' | 'away') => void;
}

const TeamSelector: React.FC<TeamSelectorProps> = ({
  homeTeamInfo,
  awayTeamInfo,
  activeTeam,
  onTeamChange,
}) => {
  return (
    <div className="flex gap-0">
      <button
        onClick={() => onTeamChange('home')}
        className={`flex-1 py-3 rounded-t-lg font-bold flex items-center justify-center gap-2 transition-all border-2 ${
          activeTeam === 'home'
            ? 'bg-[#faafe8]/20 border-[#faafe8] text-[#faafe8]'
            : 'bg-[#181a23] border-[#faafe8]/30 text-gray-400 hover:border-[#faafe8]/50'
        }`}
      >
        {homeTeamInfo.logo && <img src={homeTeamInfo.logo} alt="" className="w-7 h-6" />}
        {homeTeamInfo.name}
      </button>
      <button
        onClick={() => onTeamChange('away')}
        className={`flex-1 py-3 rounded-t-lg font-bold flex items-center justify-center gap-2 transition-all border-2 ${
          activeTeam === 'away'
            ? 'bg-[#00ffe7]/20 border-[#00ffe7] text-[#00ffe7]'
            : 'bg-[#181a23] border-[#00ffe7]/30 text-gray-400 hover:border-[#00ffe7]/50'
        }`}
      >
        {awayTeamInfo.logo && <img src={awayTeamInfo.logo} alt="" className="w-7 h-6" />}
        {awayTeamInfo.name}
      </button>
    </div>
  );
};

export default TeamSelector;
