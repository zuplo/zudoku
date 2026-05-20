import { describe, expect, it } from "vitest";
import { interpolate, mergeCatalogs, resolveI18n, translate } from "./i18n.js";

describe("i18n", () => {
  it("interpolates {name} placeholders", () => {
    expect(interpolate("hello {name}", { name: "world" })).toBe("hello world");
  });

  it("leaves unknown placeholders untouched", () => {
    expect(interpolate("hi {who}")).toBe("hi {who}");
    expect(interpolate("hi {who}", { other: "x" })).toBe("hi {who}");
  });

  it("merges catalogs with later entries winning", () => {
    const merged = mergeCatalogs(
      { en: { a: "1", b: "2" } },
      { en: { b: "B", c: "3" }, de: { a: "eins" } },
    );
    expect(merged).toEqual({
      en: { a: "1", b: "B", c: "3" },
      de: { a: "eins" },
    });
  });

  it("translates against the active locale and falls back to default", () => {
    const i18n = resolveI18n(
      {
        locale: "de",
        defaultLocale: "en",
        messages: {
          en: { greet: "Hello {name}", only_en: "EN" },
          de: { greet: "Hallo {name}" },
        },
      },
      [],
    );

    expect(translate(i18n, "greet", { name: "Mo" })).toBe("Hallo Mo");
    expect(translate(i18n, "only_en")).toBe("EN");
    expect(translate(i18n, "missing")).toBe("missing");
  });

  it("merges plugin catalogs under user overrides", () => {
    const i18n = resolveI18n(
      {
        locale: "en",
        messages: { en: { "openapi.downloadSchema": "Grab schema" } },
      },
      [{ en: { "openapi.downloadSchema": "Download schema" } }],
    );

    expect(translate(i18n, "openapi.downloadSchema")).toBe("Grab schema");
  });
});
