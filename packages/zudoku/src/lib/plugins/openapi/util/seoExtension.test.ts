import { describe, expect, it } from "vitest";
import { readSeoExtension } from "./seoExtension.js";

describe("readSeoExtension", () => {
  it("returns nothing when the extension is absent", () => {
    expect(readSeoExtension(undefined)).toEqual({});
    expect(readSeoExtension(null)).toEqual({});
    expect(readSeoExtension({ "x-displayName": "Location Key" })).toEqual({});
  });

  it("reads title and description", () => {
    expect(
      readSeoExtension({
        "x-displayName": "Location Key",
        "x-zudoku-seo": {
          title: "Daily Forecasts by Location Key - Core Weather",
          description: "Daily forecasts for a location key, up to 15 days.",
        },
      }),
    ).toEqual({
      title: "Daily Forecasts by Location Key - Core Weather",
      description: "Daily forecasts for a location key, up to 15 days.",
    });
  });

  it("allows setting only one of title or description", () => {
    expect(
      readSeoExtension({ "x-zudoku-seo": { title: "Hourly Forecasts" } }),
    ).toEqual({ title: "Hourly Forecasts", description: undefined });
    expect(
      readSeoExtension({ "x-zudoku-seo": { description: "Hourly data." } }),
    ).toEqual({ title: undefined, description: "Hourly data." });
  });

  it("trims values and ignores blank strings", () => {
    expect(
      readSeoExtension({
        "x-zudoku-seo": { title: "  Alarms  ", description: "   " },
      }),
    ).toEqual({ title: "Alarms", description: undefined });
  });

  it("ignores malformed values", () => {
    expect(readSeoExtension({ "x-zudoku-seo": null })).toEqual({});
    expect(readSeoExtension({ "x-zudoku-seo": "Alarms" })).toEqual({});
    expect(readSeoExtension({ "x-zudoku-seo": ["Alarms"] })).toEqual({
      title: undefined,
      description: undefined,
    });
    expect(
      readSeoExtension({ "x-zudoku-seo": { title: 42, description: {} } }),
    ).toEqual({ title: undefined, description: undefined });
  });
});
