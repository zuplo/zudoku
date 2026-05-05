// Removes the basePath from a pathname if present
// Returns the pathname unchanged if it's not under the basePath
export const stripBasePath = (pathname: string, basePath = ""): string => {
  if (!basePath || basePath === "/") return pathname;
  if (!pathname.toLowerCase().startsWith(basePath.toLowerCase())) {
    return pathname;
  }

  const startIndex = basePath.endsWith("/")
    ? basePath.length - 1
    : basePath.length;
  const nextChar = pathname.charAt(startIndex);
  if (nextChar && nextChar !== "/") return pathname;

  return pathname.slice(startIndex) || "/";
};

// Normalizes a redirect URL by removing the origin and optionally the root path
export const normalizeRedirectUrl = (
  redirectTo: string,
  origin: string,
  basePath = "/",
): string => {
  if (!redirectTo.startsWith(origin)) {
    return redirectTo;
  }

  if (basePath !== "/" && redirectTo.startsWith(origin + basePath)) {
    return redirectTo.slice(origin.length + basePath.length);
  }

  return redirectTo.slice(origin.length);
};
