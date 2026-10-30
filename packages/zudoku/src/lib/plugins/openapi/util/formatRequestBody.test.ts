import { describe, expect, it } from "vitest";
import {
  exampleToUrlEncodedRows,
  fromUrlEncoded,
  toUrlEncoded,
} from "./formatRequestBody.js";

describe("toUrlEncoded", () => {
  it("encodes a record of strings", () => {
    expect(toUrlEncoded({ a: "1", b: "two" })).toBe("a=1&b=two");
  });

  it("repeats keys for arrays", () => {
    expect(toUrlEncoded({ tag: ["a", "b"] })).toBe("tag=a&tag=b");
  });

  it("JSON-stringifies nested objects", () => {
    expect(toUrlEncoded({ obj: { x: 1 } })).toBe(
      `obj=${encodeURIComponent('{"x":1}')}`,
    );
  });

  it("encodes special characters in keys and values", () => {
    expect(toUrlEncoded({ "a&b": "x=y", "k+1": "hello world" })).toBe(
      "a%26b=x%3Dy&k%2B1=hello+world",
    );
  });

  it("skips undefined and stringifies null", () => {
    expect(toUrlEncoded({ a: null, b: undefined, c: "x" })).toBe("a=null&c=x");
  });

  it("passes raw strings through", () => {
    expect(toUrlEncoded("a=1&b=2")).toBe("a=1&b=2");
    expect(toUrlEncoded('{"a":"1"}')).toBe('{"a":"1"}');
  });

  it("returns empty string for non-object scalars", () => {
    expect(toUrlEncoded(null)).toBe("");
    expect(toUrlEncoded(undefined)).toBe("");
    expect(toUrlEncoded(42)).toBe("");
  });
});

describe("fromUrlEncoded", () => {
  it("parses to rows", () => {
    expect(fromUrlEncoded("a=1&b=two")).toEqual([
      { name: "a", value: "1" },
      { name: "b", value: "two" },
    ]);
  });

  it("preserves repeated keys", () => {
    expect(fromUrlEncoded("tag=a&tag=b")).toEqual([
      { name: "tag", value: "a" },
      { name: "tag", value: "b" },
    ]);
  });

  it("handles empty string", () => {
    expect(fromUrlEncoded("")).toEqual([]);
  });

  it("round-trips with toUrlEncoded", () => {
    const input = { a: "1", b: "hello world", c: "x&y" };
    expect(fromUrlEncoded(toUrlEncoded(input))).toEqual([
      { name: "a", value: "1" },
      { name: "b", value: "hello world" },
      { name: "c", value: "x&y" },
    ]);
  });
});

describe("exampleToUrlEncodedRows", () => {
  it("parses url-encoded string examples", () => {
    expect(exampleToUrlEncodedRows("grant_type=client_credentials")).toEqual([
      { name: "grant_type", value: "client_credentials" },
    ]);
  });

  it("flattens object examples with arrays into repeated rows", () => {
    expect(exampleToUrlEncodedRows({ scope: ["read", "write"] })).toEqual([
      { name: "scope", value: "read" },
      { name: "scope", value: "write" },
    ]);
  });

  it("JSON-stringifies non-string scalar values", () => {
    expect(exampleToUrlEncodedRows({ n: 42, b: true })).toEqual([
      { name: "n", value: "42" },
      { name: "b", value: "true" },
    ]);
  });

  it("returns empty array for null, arrays, or scalars", () => {
    expect(exampleToUrlEncodedRows(null)).toEqual([]);
    expect(exampleToUrlEncodedRows(42)).toEqual([]);
    expect(exampleToUrlEncodedRows([1, 2])).toEqual([]);
  });
});
