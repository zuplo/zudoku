import { describe, expect, it } from "vitest";
import { slugify } from "./slugify.js";

describe("slugify", () => {
  it("lowercases and replaces spaces", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("removes diacritics", () => {
    expect(slugify("café résumé")).toBe("cafe-resume");
  });

  it("replaces special characters with hyphens", () => {
    expect(slugify("foo@bar#baz!")).toBe("foo-bar-baz");
  });

  it("collapses consecutive non-alphanumeric chars into single hyphen", () => {
    expect(slugify("a---b")).toBe("a-b");
    expect(slugify("a   b")).toBe("a-b");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("---hello---")).toBe("hello");
    expect(slugify("!hello!")).toBe("hello");
  });

  it("returns empty string for empty input", () => {
    expect(slugify("")).toBe("");
  });

  it("preserves non-latin unicode letters", () => {
    expect(slugify("日本語テスト")).toBe("日本語テスト");
  });

  it("handles mixed content", () => {
    expect(slugify("API Reference - Get Users")).toBe(
      "api-reference-get-users",
    );
  });

  it("handles German umlauts", () => {
    expect(slugify("Über")).toBe("uber");
  });

  it("strips apostrophes instead of creating hyphens", () => {
    expect(slugify("don't stop")).toBe("dont-stop");
    expect(slugify("O'Brien")).toBe("obrien");
  });

  it("strips smart quotes", () => {
    expect(slugify("don\u2019t")).toBe("dont");
    expect(slugify("\u2018quoted\u2019")).toBe("quoted");
    expect(slugify("say \u201Chello\u201D")).toBe("say-hello");
  });
});
