import { describe, expect, it } from "vitest";
import { getEagerCssEntries } from "./build.js";

describe("getEagerCssEntries", () => {
  it("keeps eager and standalone CSS while excluding lazy chunk CSS", () => {
    const output = [
      {
        type: "chunk",
        fileName: "entry.js",
        isEntry: true,
        imports: ["vendor.js"],
        viteMetadata: { importedCss: new Set(["entry.css", "shared.css"]) },
      },
      {
        type: "chunk",
        fileName: "vendor.js",
        imports: [],
        viteMetadata: { importedCss: new Set(["vendor.css"]) },
      },
      {
        type: "chunk",
        fileName: "dialog.js",
        imports: [],
        viteMetadata: { importedCss: new Set(["dialog.css", "shared.css"]) },
      },
      { type: "asset", fileName: "entry.css" },
      { type: "asset", fileName: "vendor.css" },
      { type: "asset", fileName: "dialog.css" },
      { type: "asset", fileName: "shared.css" },
      { type: "asset", fileName: "custom-plugin-global.css" },
    ];

    expect(getEagerCssEntries(output)).toEqual([
      "entry.css",
      "vendor.css",
      "shared.css",
      "custom-plugin-global.css",
    ]);
  });

  it("keeps all CSS when chunk metadata is unavailable", () => {
    expect(
      getEagerCssEntries([
        { type: "chunk", fileName: "entry.js", isEntry: true },
        { type: "asset", fileName: "entry.css" },
        { type: "asset", fileName: "plugin.css" },
      ]),
    ).toEqual(["entry.css", "plugin.css"]);
  });
});
