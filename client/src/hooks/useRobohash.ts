
export const generateLogoHash = (name: string) => {
  return `https://robohash.org/${encodeURIComponent(name)}`;
};
