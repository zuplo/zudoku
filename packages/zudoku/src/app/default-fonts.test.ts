import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { describe, expect, test } from "vitest";

const require = createRequire(import.meta.url);

const normalizeFontCss = (css: string) =>
  css
    .replaceAll(/\/\*[\s\S]*?\*\//g, "")
    .replaceAll(/["']/g, "")
    .replaceAll(/@fontsource-variable\/geist(?:-mono)?\/files\//g, "./files/")
    .replaceAll(/\s+/g, "")
    .replaceAll("font-display:swap", "font-display:optional");

describe("default fonts", () => {
  test("stays synchronized with the bundled Fontsource stylesheets", async () => {
    const upstream = await Promise.all(
      [
        "@fontsource-variable/geist/wght.css",
        "@fontsource-variable/geist-mono/wght.css",
      ].map((id) => readFile(require.resolve(id), "utf8")),
    );
    const local = await readFile(
      new URL("./default-fonts.css", import.meta.url),
      "utf8",
    );

    expect(normalizeFontCss(local)).toBe(normalizeFontCss(upstream.join("\n")));
  });
});
