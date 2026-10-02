import { describe, expect, test } from "vitest";
import { addAcceptToVary, negotiateContentType } from "./contentNegotiation.js";

describe("negotiateContentType", () => {
  test.each([
    [undefined, "text/html"],
    [null, "text/html"],
    ["", "text/html"],
    ["   ", "text/html"],
    ["*/*", "text/html"],
    ["text/*", "text/html"],
  ])("preserves HTML server preference for %j", (accept, expected) => {
    expect(negotiateContentType(accept)).toBe(expected);
  });

  test.each([
    ["text/markdown", "text/markdown"],
    ["TEXT/MARKDOWN", "text/markdown"],
    ["text/markdown; charset=utf-8", "text/markdown"],
    ["text/markdown;q=0.9, text/html;q=0.8", "text/markdown"],
    ["text/html;q=0.5, text/markdown;q=0.6", "text/markdown"],
    ["text/markdown;q=0.5, text/html;q=0.6", "text/html"],
    ["text/markdown, */*", "text/markdown"],
    ["*/*, text/markdown", "text/markdown"],
    ["text/*, text/markdown", "text/markdown"],
    ["text/markdown, text/html", "text/markdown"],
    ["text/html, text/markdown", "text/html"],
  ])("negotiates %j as %s", (accept, expected) => {
    expect(negotiateContentType(accept)).toBe(expected);
  });

  test("uses the most specific range before applying its quality", () => {
    expect(negotiateContentType("text/markdown;q=0, */*;q=1")).toBe(
      "text/html",
    );
    expect(negotiateContentType("text/html;q=0, */*;q=1")).toBe(
      "text/markdown",
    );
    expect(negotiateContentType("text/*;q=0, text/markdown;q=0.5")).toBe(
      "text/markdown",
    );
  });

  test.each([
    "application/json",
    "text/html;q=0, text/markdown;q=0",
    "*/*;q=0",
    "text/markdown; charset=iso-8859-1",
    "not a media range",
  ])("returns null when %j does not accept either representation", (accept) => {
    expect(negotiateContentType(accept)).toBeNull();
  });

  test("ignores malformed ranges when another range is valid", () => {
    expect(negotiateContentType("text/markdown;q=2, text/html;q=0.5")).toBe(
      "text/html",
    );
  });

  test("handles quoted media type parameters without splitting their values", () => {
    expect(
      negotiateContentType(
        'text/markdown; profile="example,profile";q=1, text/html;q=0.5',
      ),
    ).toBe("text/html");
  });

  test("treats non-q parameters as media parameters regardless of order", () => {
    expect(
      negotiateContentType(
        "text/markdown;q=0.9;charset=utf-8, text/html;q=0.5",
      ),
    ).toBe("text/markdown");
    expect(
      negotiateContentType(
        "text/markdown;charset=utf-8;q=0.9, text/html;q=0.5",
      ),
    ).toBe("text/markdown");
    expect(
      negotiateContentType(
        "text/markdown;q=0.9;charset=iso-8859-1, text/html;q=0.5",
      ),
    ).toBe("text/html");
  });

  test("rejects legacy valueless accept extensions", () => {
    expect(
      negotiateContentType(
        "text/markdown;q=0.9;legacy-extension, text/html;q=0.5",
      ),
    ).toBe("text/html");
  });
});

describe("addAcceptToVary", () => {
  test.each([
    [undefined, "Accept"],
    [null, "Accept"],
    ["", "Accept"],
    ["Accept-Encoding", "Accept-Encoding, Accept"],
    ["Accept-Encoding, Origin", "Accept-Encoding, Origin, Accept"],
    ["Accept-Encoding, Accept", "Accept-Encoding, Accept"],
    ["accept, Accept-Encoding", "accept, Accept-Encoding"],
    [
      "Accept-Encoding, ACCEPT-ENCODING, Origin",
      "Accept-Encoding, Origin, Accept",
    ],
    ["*", "*"],
  ])("merges %j as %j", (vary, expected) => {
    expect(addAcceptToVary(vary)).toBe(expected);
  });
});
