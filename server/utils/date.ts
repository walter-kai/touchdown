export function extractDateComponents(isoDateString: Date): { year: number; month: number; day: number } {
  const date = isoDateString;
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // getMonth() returns 0-based month, so add 1
  const day = date.getDate();

  return { year, month, day };
}
