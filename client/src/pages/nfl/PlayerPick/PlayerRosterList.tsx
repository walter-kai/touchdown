import React from 'react';
import PlayerListItem from './PlayerListItem';
import type { Athlete } from '@/types/espn/athlete';

interface PlayerRosterListProps {
  title: string;
  roster: Athlete[];
  positionFilter: string[];
  selectedPlayers: Athlete[];
  currentPlayers: Athlete[];
  onPlayerSelect: (player: Athlete) => void;
}

const PlayerRosterList: React.FC<PlayerRosterListProps> = ({
  title,
  roster,
  positionFilter,
  selectedPlayers,
  currentPlayers,
  onPlayerSelect,
}) => {
  const filteredRoster = roster.filter(player => 
    positionFilter.includes(player.position.abbreviation)
  );

  return (
    <div>
      <h5 className="text-[#faafe8] font-bold text-sm mb-2">{title}</h5>
      <div className="space-y-2">
        {filteredRoster.map((player) => {
          const isInNew = selectedPlayers.some((p) => p.id === player.id);
          const isInCurrent = currentPlayers.some((p) => p.id === player.id);
          const isDuplicate = isInCurrent && !isInNew;
          
          return (
            <PlayerListItem
              key={player.id}
              player={player}
              isSelected={isInNew}
              isDisabled={isDuplicate}
              onClick={() => onPlayerSelect(player)}
            />
          );
        })}
      </div>
    </div>
  );
};

export default PlayerRosterList;
