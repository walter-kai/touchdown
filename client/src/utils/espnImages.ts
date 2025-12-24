// Utility to normalize ESPN headshot URLs from either embedded hrefs or athlete ids
export const getHeadshotUrl = (
  opts: {
    id?: string | number;
    headshot?: string | { href?: string } | null;
  } | null | undefined,
  league: 'nfl' | 'nba'
): string => {
  if (!opts) return '';
  const raw = (opts as any).headshot;
  const href = typeof raw === 'string' ? raw : raw?.href;
  if (href) return href;
  const id = (opts as any).id;
  if (!id) return '';
  // const league = 'nba' ? 'nba' : 'nfl';
  return `https://a.espncdn.com/i/headshots/${league}/players/full/${id}.png`;
};

// Convenience overload for plain id or raw headshot string
export const getHeadshotFromIdOrUrl = (id?: string | number, raw?: string, league: 'nfl' | 'nba' = 'nfl'): string => {
  if (raw) return raw;
  if (!id) return '';
  const sport = league === 'nba' ? 'nba' : 'nfl';
  return `https://a.espncdn.com/i/headshots/${league}/players/full/${id}.png`;
};

// Get team logo URL from abbreviation
// Example: getTeamLogoUrl('wsh', 'nba') => 'https://a.espncdn.com/i/teamlogos/nba/500/wsh.png'
export const getTeamLogoUrl = (abbreviation: string, league: 'nfl' | 'nba'): string => {
  if (!abbreviation) return '';
  return `https://a.espncdn.com/i/teamlogos/${league}/500/${abbreviation.toLowerCase()}.png`;
};