/**
 * Server-side rendering wrapper for rehype-mermaid.
 *
 * This file is in a separate module to avoid Vite trying to resolve
 * rehype-mermaid during static analysis when it's not installed.
 *
 * This module is only imported when users explicitly configure
 * server-side rendering strategies.
 */

export const loadRehypeMermaid = async () => {
  try {
    // @vite-ignore - This is an optional dependency that users install separately
    const module = await import("rehype-mermaid");
    return module.default;
  } catch (error) {
    throw new Error(
      `rehype-mermaid is not installed. Install it with: npm install rehype-mermaid\n\n` +
        `For server-side rendering, also install Playwright:\n` +
        `npm install -D playwright && npx playwright install chromium\n\n` +
        `Original error: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};
