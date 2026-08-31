import type { BuildArtifactPlugin, CommonPlugin } from "../../core/plugins.js";

const discoveryLinks = [
  {
    rel: "ard",
    type: "application/json",
    href: "/.well-known/ard.json",
  },
  {
    rel: "api-catalog",
    type: 'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"',
    href: "/.well-known/api-catalog",
  },
];

const buildContributionsModule = new URL(
  ["..", "..", "..", "..", "dist", "plugins", "agentic-build.js"].join("/"),
  import.meta.url,
).href;

/**
 * Publishes API and MCP discovery from the resolved Zudoku/OpenAPI config.
 * No protocol filenames or primary API selector need to be configured.
 */
export const agenticPlugin = (): CommonPlugin & BuildArtifactPlugin => ({
  buildContributionsModule,
  getHeadLinks: ({ canonicalUrlOrigin }) =>
    canonicalUrlOrigin || import.meta.env.ZUDOKU_HAS_CANONICAL_ORIGIN
      ? discoveryLinks
      : undefined,
});
