// Utility to normalize ESPN headshot URLs from either embedded hrefs or athlete ids
export const getHeadshotUrl = (
  opts: {
    id?: string | number;
    headshot?: string | { href?: string } | null;
  } | null | undefined
): string => {
  if (!opts) return '';
  const raw = (opts as any).headshot;
  const href = typeof raw === 'string' ? raw : raw?.href;
  if (href) return href;
  const id = (opts as any).id;
  if (!id) return '';
  return `https://a.espncdn.com/i/headshots/nfl/players/full/${id}.png`;
};

// Convenience overload for plain id or raw headshot string
export const getHeadshotFromIdOrUrl = (id?: string | number, raw?: string): string => {
  if (raw) return raw;
  if (!id) return '';
  return `https://a.espncdn.com/i/headshots/nfl/players/full/${id}.png`;
};