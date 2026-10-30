import {
  createHead,
  renderSSRHead,
  UnheadProvider,
} from "@unhead/react/server";
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

const renderHeadSSR = async (plugins: ZudokuPlugin[]) => {
  const head = createHead();

  renderToString(
    <UnheadProvider value={head}>
      <PluginHeads plugins={plugins} location={loc} />
    </UnheadProvider>,
  );

  return renderSSRHead(head);
};

describe("PluginHeads SSR injection", () => {
  it("single meta element", async () => {
    const { headTags } = await renderHeadSSR([
      { getHead: () => <meta name="test-single" content="val" /> },
    ]);
    expect(headTags).toContain('name="test-single"');
  });

  it("array of elements", async () => {
    const { headTags } = await renderHeadSSR([
      {
        getHead: () => [
          <meta key="a" name="arr-a" content="a" />,
          <meta key="b" name="arr-b" content="b" />,
        ],
      },
    ]);
    expect(headTags).toContain('name="arr-a"');
    expect(headTags).toContain('name="arr-b"');
  });

  it("fragment with scripts (PostHog pattern)", async () => {
    const { headTags } = await renderHeadSSR([
      {
        getHead: () => (
          <>
            <script>{`window.__PH=true`}</script>
            <meta name="ph-verify" content="yes" />
          </>
        ),
      },
    ]);
    expect(headTags).toContain("__PH");
    expect(headTags).toContain("ph-verify");
  });

  it("multiple plugins", async () => {
    const { headTags } = await renderHeadSSR([
      { getHead: () => <meta name="plugin-a" content="a" /> },
      {
        getHead: () => (
          <>
            <meta name="plugin-b" content="b" />
          </>
        ),
      },
    ]);
    expect(headTags).toContain('name="plugin-a"');
    expect(headTags).toContain('name="plugin-b"');
  });
});
