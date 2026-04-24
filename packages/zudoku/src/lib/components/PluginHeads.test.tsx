import { type HelmetData, HelmetProvider } from "@zudoku/react-helmet-async";
import { renderToString } from "react-dom/server";
import type { Location } from "react-router";
import { describe, expect, it } from "vitest";
import type { ZudokuPlugin } from "../core/plugins.js";
import { PluginHeads } from "./PluginHeads.js";

const loc = {
  pathname: "/",
  search: "",
  hash: "",
  state: null,
  key: "default",
} as Location;

const renderHeadSSR = (plugins: ZudokuPlugin[]) => {
  const ctx = {} as HelmetData["context"];

  renderToString(
    <HelmetProvider context={ctx}>
      <PluginHeads plugins={plugins} location={loc} />
    </HelmetProvider>,
  );

  return ctx.helmet;
};

describe("PluginHeads SSR injection", () => {
  it("single meta element", () => {
    const helmet = renderHeadSSR([
      { getHead: () => <meta name="test-single" content="val" /> },
    ]);
    expect(helmet?.meta?.toString()).toContain('name="test-single"');
  });

  it("array of elements", () => {
    const helmet = renderHeadSSR([
      {
        getHead: () => [
          <meta key="a" name="arr-a" content="a" />,
          <meta key="b" name="arr-b" content="b" />,
        ],
      },
    ]);
    const meta = helmet?.meta?.toString() ?? "";
    expect(meta).toContain('name="arr-a"');
    expect(meta).toContain('name="arr-b"');
  });

  it("fragment with scripts (PostHog pattern)", () => {
    const helmet = renderHeadSSR([
      {
        getHead: () => (
          <>
            <script>{`window.__PH=true`}</script>
            <meta name="ph-verify" content="yes" />
          </>
        ),
      },
    ]);
    expect(helmet?.script?.toString()).toContain("__PH");
    expect(helmet?.meta?.toString()).toContain("ph-verify");
  });

  it("multiple plugins", () => {
    const helmet = renderHeadSSR([
      { getHead: () => <meta name="plugin-a" content="a" /> },
      {
        getHead: () => (
          <>
            <meta name="plugin-b" content="b" />
          </>
        ),
      },
    ]);
    const meta = helmet?.meta?.toString() ?? "";
    expect(meta).toContain('name="plugin-a"');
    expect(meta).toContain('name="plugin-b"');
  });
});
