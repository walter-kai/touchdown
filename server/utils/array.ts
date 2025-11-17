// Function to chunk the gameIds array
export const chunkArray = <T>(array: Array<T>, chunkSize: number): Array<Array<T>> => {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

export function getCenteredElements<T>(arr: T[], index: number): T[] {
  // Ensure the index is within the bounds of the array
  index = Math.max(0, Math.min(index, arr.length - 1));

  let startIndex = index - 3;
  let endIndex = index + 3;

  // Adjust startIndex and endIndex to ensure they are within the array bounds
  if (startIndex < 0) {
    endIndex -= startIndex; // Adjust the endIndex accordingly
    startIndex = 0;
  }

  if (endIndex >= arr.length) {
    startIndex = Math.max(0, startIndex - (endIndex - arr.length + 1));
    endIndex = arr.length - 1;
  }

  // Slice the array to get the centered elements
  return arr.slice(startIndex, endIndex + 1);
}
