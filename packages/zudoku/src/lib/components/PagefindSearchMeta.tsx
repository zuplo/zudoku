import type { PropsWithChildren } from "react";

/**
 * Adds metadata to be captured by Pagefind for search results.
 * Content is visually hidden but indexed by the search engine.
 */
export const PagefindSearchMeta = ({
  name,
  children,
}: PropsWithChildren<{ name?: string }>) => (
  <span data-pagefind-meta={name} className="sr-only">
    {children}
  </span>
);
