/**
 * Decide the Cache-Control header for an SSR response.
 *
 * - Authed renders embed the user's profile in HTML, so they must never be
 *   shared-cached. Always `private, no-store`.
 * - Anonymous successful (200) renders use the standard two-tier SSR cache
 *   pattern: `max-age=0, must-revalidate` keeps browsers from caching
 *   navigations, `s-maxage=60` lets shared caches (CDNs) absorb concurrent
 *   load.
 * - Non-200 responses get no Cache-Control here — error/redirect handling
 *   is delegated to the calling layer.
 */
export const getSsrCacheControl = (
  status: number,
  isAuthed: boolean,
): string | undefined => {
  if (isAuthed) return "private, no-store";
  if (status === 200) return "public, max-age=0, s-maxage=60, must-revalidate";
  return undefined;
};
