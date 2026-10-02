import { describe, expect, it } from "vitest";
import { getSeoExtension } from "./getSeoExtension.js";

describe("getSeoExtension", () => {
  it("returns title and description", () => {
    expect(
      getSeoExtension({
        "x-zudoku-seo": {
          title: "Warp Drive Diagnostics",
          description: "Monitor quantum flux across the fleet",
        },
      }),
    ).toEqual({
      title: "Warp Drive Diagnostics",
      description: "Monitor quantum flux across the fleet",
    });
  });

  it("returns an empty object when the extension is missing", () => {
    expect(getSeoExtension(undefined)).toEqual({});
    expect(getSeoExtension(null)).toEqual({});
    expect(getSeoExtension({ "x-displayName": "Cargo" })).toEqual({});
  });

  it("ignores malformed values", () => {
    expect(getSeoExtension({ "x-zudoku-seo": "Warp Drive" })).toEqual({});
    expect(getSeoExtension({ "x-zudoku-seo": ["Warp Drive"] })).toEqual({
      title: undefined,
      description: undefined,
    });
    expect(
      getSeoExtension({ "x-zudoku-seo": { title: 42, description: {} } }),
    ).toEqual({ title: undefined, description: undefined });
  });

  it("trims values and treats blank strings as unset", () => {
    expect(
      getSeoExtension({
        "x-zudoku-seo": { title: "  Nebula Routes  ", description: "   " },
      }),
    ).toEqual({ title: "Nebula Routes", description: undefined });
  });
});
