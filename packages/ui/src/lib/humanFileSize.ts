/**
 * Converts a number of bytes to a human-readable file size string
 * @param bytes - The number of bytes (defaults to 0)
 * @returns A formatted string like "1.23 MB" or "456 B"
 */
export const humanFileSize = (bytes = 0) => {
  if (bytes === 0) {
    return "0 B";
  }

  const exponent = Math.floor(Math.log(bytes) / Math.log(1000.0));
  const decimal = (bytes / 1000.0 ** exponent).toFixed(exponent ? 2 : 0);

  return `${decimal} ${exponent ? `${"kMGTPEZY"[exponent - 1]}B` : "B"}`;
};
