export const slugify = (str: string) =>
  str
    .normalize("NFKD") // Decompose everything
    .replace(/\p{Diacritic}/gu, "") // Remove diacritics
    .toLocaleLowerCase() // Lowercase
    .replace(/[^\p{L}\p{N}]+/gu, "-") // Non-alphanumeric → hyphen
    .split("-") // Split into words
    .join("-") // Rejoin
    .replace(/-+/g, "-") // Clean up
    .replace(/^-|-$/g, ""); // Trim edges
