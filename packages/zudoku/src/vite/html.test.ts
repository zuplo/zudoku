import { describe, expect, test } from "vitest";
import { getBuildHtml } from "./html.js";

describe("getBuildHtml", () => {
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
  });

  test("does not load a separate activator by default", () => {
    const html = getBuildHtml({
      jsEntry: "/assets/entry.js",
      cssEntries: ["/assets/entry.css"],
    });

    expect(html).not.toContain("zudoku-critical-css");
  });
});
