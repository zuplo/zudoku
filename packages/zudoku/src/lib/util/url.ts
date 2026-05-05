// Removes the basepath from a pathname if present
// Returns the pathname unchanged if it's not under the basepath
export const stripBasepath = (pathname: string, basepath = ""): string => {
  if (!basepath || basepath === "/") return pathname;
  if (!pathname.toLowerCase().startsWith(basepath.toLowerCase())) {
    return pathname;
  }

  const startIndex = basepath.endsWith("/")
    ? basepath.length - 1
    : basepath.length;
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
