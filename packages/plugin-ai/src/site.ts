import { joinUrl } from "zudoku";

const LOCALHOST_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "[::1]",
]);

/** Whether a hostname refers to the local machine (dev server). */
export const isLocalhostHostname = (hostname: string): boolean =>
  LOCALHOST_HOSTNAMES.has(hostname) || hostname.endsWith(".local");

/**
 * Reads the dev portal deployment URL that the Zuplo build injects into
 * `ZUPLO_BUILD_CONFIG`. Returns `undefined` outside of Zuplo projects.
 *
 * The reference must be the exact `import.meta.env.ZUPLO_BUILD_CONFIG` form so
 * the consuming Zudoku/Vite build replaces it (see `defineEnvVars` in core).
 *
 * The deployed dev portal URL lives at `urls.devPortal.defaultUrl` — core sends
 * a `DeploymentUrlConfig` (`{ api, devPortal }`), not a top-level
 * `deploymentUrl`. `urls.api.defaultUrl` is the gateway URL (a.k.a.
 * `ZUPLO_SERVER_URL`), so it must NOT be used here.
 */
export const getZuploDeploymentUrl = (): string | undefined => {
  const raw = import.meta.env.ZUPLO_BUILD_CONFIG;
  if (typeof raw !== "string") return undefined;
  try {
    const config = JSON.parse(raw) as {
      urls?: { devPortal?: { defaultUrl?: unknown } };
    };
    const url = config.urls?.devPortal?.defaultUrl;
    return typeof url === "string" && url ? url : undefined;
  } catch {
    return undefined;
  }
};

export type DocsContext = {
  /** Absolute URL of the docs site, sent to the backend as `docs`. */
  docs: string;
  /**
   * True when there is no publicly reachable docs URL (local dev without a
   * deployment URL), so the assistant can't be used.
   */
  isUnavailable: boolean;
};

/**
 * Resolves the documentation site URL forwarded to the chat backend as `docs`.
 *
 * Order of preference:
 * 1. A deployment URL (e.g. the Zuplo dev portal URL) — used even on localhost
 *    so the assistant works while developing.
 * 2. The current origin + base path, when served from a public host.
 * 3. Otherwise (localhost with no deployment URL) the assistant is unavailable.
 */
export const resolveDocsContext = (
  basePath: string | undefined,
  deploymentUrl?: string,
): DocsContext => {
  if (deploymentUrl) {
    return { docs: deploymentUrl, isUnavailable: false };
  }
  if (typeof window === "undefined") {
    return { docs: "", isUnavailable: false };
  }
  const { origin, hostname } = window.location;
  if (isLocalhostHostname(hostname)) {
    return { docs: "", isUnavailable: true };
  }
  return { docs: joinUrl(origin, basePath ?? "/"), isUnavailable: false };
};
