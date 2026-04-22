import type { UserProfile } from "./state.js";

export const ACCESS_TOKEN_COOKIE = "zudoku-access-token";
export const REFRESH_TOKEN_COOKIE = "zudoku-refresh-token";
export const AUTH_PROFILE_COOKIE = "zudoku-auth-profile";

export type AuthCookies = {
  accessToken: string | undefined;
  refreshToken: string | undefined;
  profile: UserProfile | undefined;
};

export const parseCookies = (request: Request): AuthCookies => {
  const header = request.headers.get("Cookie") ?? "";

  if (!header) {
    return {
      accessToken: undefined,
      refreshToken: undefined,
      profile: undefined,
    };
  }

  const cookies = Object.fromEntries(
    header.split(";").map((c) => {
      const [key, ...rest] = c.trim().split("=");
      return [key, decodeURIComponent(rest.join("="))];
    }),
  );

  let profile: UserProfile | undefined;
  try {
    if (cookies[AUTH_PROFILE_COOKIE]) {
      profile = JSON.parse(cookies[AUTH_PROFILE_COOKIE]);
    }
  } catch {
    // ignore malformed cookie
  }

  return {
    accessToken: cookies[ACCESS_TOKEN_COOKIE] || undefined,
    refreshToken: cookies[REFRESH_TOKEN_COOKIE] || undefined,
    profile,
  };
};
