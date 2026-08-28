import {
  createHead,
  renderSSRHead,
  UnheadProvider,
} from "@unhead/react/server";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PluginHeads } from "../../components/PluginHeads.js";
import { createAgenticBuildContributions } from "./build.js";
import { agenticPlugin } from "./index.js";

const location = {
  pathname: "/",
  search: "",
  hash: "",
  state: null,
  key: "default",
};

const renderPluginHead = async (canonicalUrlOrigin?: string) => {
  const head = createHead();
  const plugin = agenticPlugin();

  renderToString(
    <UnheadProvider value={head}>
      <PluginHeads
        plugins={[plugin]}
        location={location}
        canonicalUrlOrigin={canonicalUrlOrigin}
      />
    </UnheadProvider>,
  );

  return { plugin, headTags: (await renderSSRHead(head)).headTags };
};

describe("agenticPlugin head discovery", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("advertises root discovery with exact media types", async () => {
    const { plugin, headTags } = await renderPluginHead(
      "https://developers.example.com",
    );
    expect(plugin.buildContributionsModule).toMatch(
      /\/dist\/plugins\/agentic-build\.js$/,
    );

    expect(headTags).toContain(
      '<link rel="ard" type="application/json" href="/.well-known/ard.json">',
    );
    expect(headTags).toContain(
      '<link rel="api-catalog" type="application/linkset+json; profile=&quot;https://www.rfc-editor.org/info/rfc9727&quot;" href="/.well-known/api-catalog">',
    );
  });

  it("advertises discovery when the build injects a Vercel production origin", async () => {
    vi.stubEnv("ZUDOKU_HAS_CANONICAL_ORIGIN", "true");

    const { headTags } = await renderPluginHead();
    expect(headTags).toContain('rel="ard"');
    expect(headTags).toContain('rel="api-catalog"');
  });

  it("does not advertise discovery when origin-bound artifacts are skipped", async () => {
    const contributions = createAgenticBuildContributions({
      basePath: "/docs",
      canonicalOrigin: undefined,
      siteTitle: "Example",
      apis: [],
    });
    const { headTags } = await renderPluginHead();

    expect(
      contributions.artifacts?.some((artifact) =>
        artifact.urlPath.includes("/.well-known/"),
      ),
    ).toBe(false);
    expect(contributions.warnings).toEqual([
      expect.stringContaining("canonicalUrlOrigin"),
    ]);
    expect(headTags).not.toContain("/.well-known/");
  });
});
