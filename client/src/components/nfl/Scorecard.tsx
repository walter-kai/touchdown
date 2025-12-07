                <div className="grid grid-cols-2 gap-4 items-center">
                  <button
                    onClick={() => awayTeam?.id && navigate(`/nfl/team/${awayTeam.id}`)}
                    className="flex flex-col items-center hover:bg-[#00ffe7]/10 rounded-lg p-3 transition-all group cursor-pointer"
                  >
                    <img
                      src={getTeamLogo(awayTeam?.team)}
                      alt={awayTeam?.team?.displayName}
                      className="w-16 h-16 md:w-20 md:h-20 mb-2 group-hover:scale-110 transition-transform"
                    />
                    <h2 className="text-[#e0e7ef] font-bold text-sm md:text-base text-center px-2 group-hover:text-[#00ffe7] transition-colors">
                      {awayTeam?.team?.displayName}
                    </h2>
                    <p className="text-[#b0b7bf] text-xs">{awayTeam?.records?.[0]?.summary}</p>
                    <p className="text-[#00ffe7] text-3xl md:text-4xl font-bold mt-1">{awayTeam?.score || '0'}</p>
                  </button>

                  <button
                    onClick={() => homeTeam?.id && navigate(`/nfl/team/${homeTeam.id}`)}
                    className="flex flex-col items-center hover:bg-[#00ffe7]/10 rounded-lg p-3 transition-all group cursor-pointer"
                  >
                    <img
                      src={getTeamLogo(homeTeam?.team)}
                      alt={homeTeam?.team?.displayName}
                      className="w-16 h-16 md:w-20 md:h-20 mb-2 group-hover:scale-110 transition-transform"
                    />
                    <h2 className="text-[#e0e7ef] font-bold text-sm md:text-base text-center px-2 group-hover:text-[#00ffe7] transition-colors">
                      {homeTeam?.team?.displayName}
                    </h2>
                    <p className="text-[#b0b7bf] text-xs">{homeTeam?.records?.[0]?.summary}</p>
                    <p className="text-[#00ffe7] text-3xl md:text-4xl font-bold mt-1">{homeTeam?.score || '0'}</p>
                  </button>
                </div>