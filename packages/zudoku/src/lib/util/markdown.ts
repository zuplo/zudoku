/**
 * Converts a pathname (e.g. location.pathname) to the corresponding
 * markdown URL segment. Handles the root path "/" → "/index" mapping
 * so the URL becomes "/index.md" instead of "/.md".
 */
export const getMarkdownPathname = (pathname: string): string =>
  pathname === "/" ? "/index" : pathname;
