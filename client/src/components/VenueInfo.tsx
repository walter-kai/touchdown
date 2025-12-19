import React from 'react';
import { FaMapMarkerAlt } from 'react-icons/fa';

interface VenueInfoProps {
  competition: any;
  summary?: any;
}

const VenueInfo: React.FC<VenueInfoProps> = ({ competition, summary }) => {
  const venue = summary?.gameInfo?.venue || competition.venue;
  const venueImage = summary?.gameInfo?.venue?.images?.[0]?.href;

  if (!venue) return null;

  return (
    <div className="mb-4">
      {/* Header */}
      <div className="bg-bg-dark/90 border-t-2 border-neon-cyan/20 border-b border-neon-cyan/10 py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-neon-cyan/10 flex items-center justify-center">
            <FaMapMarkerAlt className="text-neon-cyan text-lg" />
          </div>
          <div>
            <h3 className="text-neon-cyan font-bold text-xl uppercase tracking-wide">
              Venue Information
            </h3>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-bg-dark/50 border-b border-neon-cyan/10">
        {venueImage && (
          <div className="relative h-32 overflow-hidden">
            <img 
              src={venueImage}
              alt="Venue"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg-dark/90" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h4 className="text-white font-bold text-lg drop-shadow-lg">
                {venue.fullName}
              </h4>
              {venue.address && (
                <p className="text-white/90 text-sm drop-shadow-lg">
                  {venue.address.city}, {venue.address.state}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="p-4">
          {!venueImage && (
            <div className="mb-3">
              <h4 className="text-white font-bold text-lg mb-1">
                {venue.fullName}
              </h4>
              {venue.address && (
                <p className="text-text-muted text-sm">
                  {venue.address.city}, {venue.address.state}
                </p>
              )}
            </div>
          )}

          {/* Game Info Grid */}
          <div className="bg-bg-darker/50 rounded-lg p-3 border border-neon-cyan/10">
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {(summary?.gameInfo?.attendance || competition.attendance) && (
                <>
                  <span className="text-text-muted">Attendance</span>
                  <span className="text-white font-semibold text-right">
                    {(summary?.gameInfo?.attendance || competition.attendance).toLocaleString()}
                  </span>
                </>
              )}
              
              {competition.broadcasts && competition.broadcasts.length > 0 && (
                <>
                  <span className="text-text-muted">Network</span>
                  <span className="text-white font-semibold text-right">
                    {competition.broadcasts[0].names?.[0] || competition.broadcasts[0].market}
                  </span>
                </>
              )}
              
              {competition.odds && competition.odds.length > 0 && competition.odds[0].details && (
                <>
                  <span className="text-text-muted">Spread</span>
                  <span className="text-white font-semibold text-right">
                    {competition.odds[0].details}
                  </span>
                </>
              )}
              
              {competition.odds && competition.odds.length > 0 && competition.odds[0].overUnder && (
                <>
                  <span className="text-text-muted">Over/Under</span>
                  <span className="text-white font-semibold text-right">
                    {competition.odds[0].overUnder}
                  </span>
                </>
              )}
              
              {competition.notes && competition.notes.length > 0 && (
                <>
                  <span className="text-text-muted">Notes</span>
                  <span className="text-white font-semibold text-right">
                    {competition.notes[0].headline}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueInfo;
