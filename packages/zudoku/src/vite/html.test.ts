import { describe, expect, test } from "vitest";
import { getBuildHtml } from "./html.js";

describe("getBuildHtml", () => {
  test("does not preload optional bundled fonts", () => {
    const html = getBuildHtml({
      jsEntry: "/assets/entry.js",
      cssEntries: ["/assets/entry.css"],
    });

    expect(html).not.toContain('as="font"');
  });

  test("loads the critical CSS activator before the application entry", () => {
    const html = getBuildHtml({
      jsEntry: "/assets/entry.js",
      cssEntries: ["/assets/entry.css"],
      deferredStylesheetActivator: "/assets/zudoku-critical-css.js",
    });

    expect(html).toContain(
      '<script defer src="/assets/zudoku-critical-css.js"></script>',
    );
    expect(html.indexOf("entry.css")).toBeLessThan(
      html.indexOf("zudoku-critical-css.js"),
    );
    expect(html.indexOf("zudoku-critical-css.js")).toBeLessThan(
      html.indexOf("entry.js"),
    );
    expect(html).toContain(
      '<script type="module" crossorigin fetchpriority="low" src="/assets/entry.js"></script>',
    );
  });

  test("does not load a separate activator by default", () => {
    const html = getBuildHtml({
      jsEntry: "/assets/entry.js",
      cssEntries: ["/assets/entry.css"],
    });

    expect(html).not.toContain("zudoku-critical-css");
    expect(html).not.toContain('fetchpriority="low"');
  });
});
