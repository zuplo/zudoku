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

export type DocsContext = {
  /** Absolute base URL of the docs site, sent to the backend as `docs`. */
  docs: string;
  /** Whether the docs are being served from localhost. */
  isLocalhost: boolean;
};

/**
 * Resolves the documentation site's public URL (origin + base path) so it can
 * be forwarded to the chat backend. Returns `isLocalhost` when running on a
 * dev server, where that URL is not reachable by the service.
 */
export const resolveDocsContext = (basePath?: string): DocsContext => {
  if (typeof window === "undefined") {
    return { docs: "", isLocalhost: false };
  }
  const { origin, hostname } = window.location;
  return {
    docs: joinUrl(origin, basePath ?? "/"),
    isLocalhost: isLocalhostHostname(hostname),
  };
};
