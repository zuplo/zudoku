/**
 * Normalizes a redirect URL by removing the origin and optionally the root path
 */
export function normalizeRedirectUrl(
  redirectTo: string,
  origin: string,
  basePath: string = "/",
): string {
  if (!redirectTo.startsWith(origin)) {
    return redirectTo;
  }

  if (basePath !== "/" && redirectTo.startsWith(origin + basePath)) {
    return redirectTo.slice(origin.length + basePath.length);
  }

  return redirectTo.slice(origin.length);
}
