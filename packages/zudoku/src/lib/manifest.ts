import type { ZudokuConfig } from "../config/config.js";
import {
  ACCESS_TOKEN_COOKIE,
  AUTH_PROFILE_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "./authentication/cookies.js";
import { normalizeProtectedRoutes } from "./core/ZudokuContext.js";
import { joinUrl } from "./util/joinUrl.js";

export const PROTECTED_CHUNK_DIR = "_protected";

// Bump on schema-breaking changes; external tooling keys off this.
export const MANIFEST_VERSION = 1;

export const MANIFEST_FILENAME = "zudoku-manifest.json";

export type ZudokuManifest = {
  version: number;
  basePath: string;
  ssrEntry: string;
  // URL prefixes without trailing slash; consumers append `/*` for globs.
  static: { prefixes: string[] };
  protected: {
    chunkPrefix: string;
    routePatterns: string[];
  };
  auth: {
    sessionEndpoint: string;
    cookies: {
      access: string;
      refresh: string;
      profile: string;
    };
  };
};

export const buildManifest = (
  config: Pick<ZudokuConfig, "basePath" | "protectedRoutes">,
): ZudokuManifest => {
  // Called with the raw config from the SSR entry (`virtual:zudoku-config`),
  // so normalization must happen here. Idempotent for parsed configs.
  const protectedRoutes = normalizeProtectedRoutes(config.protectedRoutes);
  const routePatterns = protectedRoutes ? Object.keys(protectedRoutes) : [];
  return {
    version: MANIFEST_VERSION,
    basePath: config.basePath ?? "/",
    ssrEntry: "server/entry.js",
    static: {
      prefixes: [joinUrl(config.basePath, "assets")],
    },
    protected: {
      chunkPrefix: joinUrl(config.basePath, PROTECTED_CHUNK_DIR),
      routePatterns,
    },
    auth: {
      sessionEndpoint: joinUrl(config.basePath, "/__z/auth/session"),
      cookies: {
        access: ACCESS_TOKEN_COOKIE,
        refresh: REFRESH_TOKEN_COOKIE,
        profile: AUTH_PROFILE_COOKIE,
      },
    },
  };
};
