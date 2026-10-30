/**
 * Flattens Markdown to a single line of plain text, truncated to `maxLength`.
 * Use this for text React renders — React escapes on output, so pre-escaped
 * entities would show up literally as `&#039;`.
 */
export function stripMarkdown(
  description: string,
  maxLength: number = 160,
): string {
  if (!description) {
    return "";
  }

  return (
    description
      // Replace Markdown links [text](url) with just "text"
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      // Remove Markdown image syntax: ![alt](url)
      .replace(/!\[.*?\]\(.*?\)/g, "")
      // Remove other Markdown syntax (e.g., **bold**, _italic_, `code`)
      .replace(/[_*`~]/g, "")
      // Remove headings (# Heading), blockquotes (> Quote), and horizontal rules (--- or ***)
      .replace(/^(?:>|\s*#+|-{3,}|\*{3,})/gm, "")
      // Remove any remaining formatting characters
      .replace(/[|>{}[\]]/g, "")
      // Collapse multiple spaces and trim the text
      .replace(/\s+/g, " ")
      .trim()
      // Limit to the specified maximum length
      .substring(0, maxLength)
  );
}

export function sanitizeMarkdownForMetatag(
  description: string,
  maxLength: number = 160,
): string {
  return stripMarkdown(description, maxLength)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
