export function slugify(input: string, maxLength: number = 50): string {
  // Replace any character that isn't alphanumeric, space, or hyphen with a hyphen
  // Also replace multiple consecutive non-alphanumeric characters with a single hyphen
  const sanitized = input
    .replace(/'/g, "")
    .replace(/[^a-zA-Z0-9\s-]/g, "-")
    .replace(/[\s\r\n]+/g, "-")
    .replace(/-+/g, "-")
    .trim();

  // Split by hyphens, filter empty strings, and convert to lowercase
  const parts = sanitized
    .split("-")
    .filter((part): part is string => Boolean(part))
    .map((part) => part.toLowerCase());

  // Return empty string if no valid parts
  if (parts.length === 0) {
    return "";
  }

  // Reverse array and reduce from right to left, stopping at maxLength
  return [...parts]
    .reverse()
    .reduce<string[]>((acc, part) => {
      const newResult = [...acc, part].join("-");
      return newResult.length <= maxLength ? [...acc, part] : acc;
    }, [])
    .reverse()
    .join("-");
}
