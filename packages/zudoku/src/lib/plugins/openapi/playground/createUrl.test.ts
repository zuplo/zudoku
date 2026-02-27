import { describe, expect, it } from "vitest";
import { createUrl, parseArrayParamValue } from "./createUrl.js";
import type { PlaygroundForm } from "./Playground.js";

describe("parseArrayParamValue", () => {
  it("returns empty array for empty string", () => {
    expect(parseArrayParamValue("")).toEqual([]);
  });

  it("parses JSON array string", () => {
    expect(parseArrayParamValue('["PENDING","IN_REVIEW"]')).toEqual([
      "PENDING",
      "IN_REVIEW",
    ]);
  });

  it("parses single-element JSON array", () => {
    expect(parseArrayParamValue('["PENDING"]')).toEqual(["PENDING"]);
  });

  it("returns empty array for empty JSON array", () => {
    expect(parseArrayParamValue("[]")).toEqual([]);
  });

  it("wraps plain string in array", () => {
    expect(parseArrayParamValue("PENDING")).toEqual(["PENDING"]);
  });

  it("converts non-string array elements to strings", () => {
    expect(parseArrayParamValue("[1,2,3]")).toEqual(["1", "2", "3"]);
  });

  it("wraps non-array JSON value in array using original string", () => {
    expect(parseArrayParamValue('"PENDING"')).toEqual(['"PENDING"']);
  });
});

const makeFormData = (
  overrides: Partial<PlaygroundForm> = {},
): PlaygroundForm => ({
  body: "",
  multipartFormFields: [],
  queryParams: [],
  pathParams: [],
  headers: [],
  ...overrides,
});

describe("createUrl", () => {
  it("creates a basic URL with no params", () => {
    const url = createUrl(
      "https://api.example.com",
      "/v1/products",
      makeFormData(),
    );
    expect(url.toString()).toBe("https://api.example.com/v1/products");
  });

  it("adds active scalar query params", () => {
    const url = createUrl(
      "https://api.example.com",
      "/v1/products",
      makeFormData({
        queryParams: [
          { name: "page", value: "1", active: true },
          { name: "size", value: "10", active: true },
        ],
      }),
    );
    expect(url.searchParams.get("page")).toBe("1");
    expect(url.searchParams.get("size")).toBe("10");
  });

  it("skips inactive query params", () => {
    const url = createUrl(
      "https://api.example.com",
      "/v1/products",
      makeFormData({
        queryParams: [
          { name: "page", value: "1", active: true },
          { name: "size", value: "10", active: false },
        ],
      }),
    );
    expect(url.searchParams.get("page")).toBe("1");
    expect(url.searchParams.has("size")).toBe(false);
  });

  it("expands array params into multiple query params (explode style)", () => {
    const url = createUrl(
      "https://api.example.com",
      "/v1/products",
      makeFormData({
        queryParams: [
          {
            name: "statuses",
            value: '["PENDING","IN_REVIEW"]',
            active: true,
            isArray: true,
          },
        ],
      }),
    );
    expect(url.searchParams.getAll("statuses")).toEqual([
      "PENDING",
      "IN_REVIEW",
    ]);
  });

  it("handles single-value array param", () => {
    const url = createUrl(
      "https://api.example.com",
      "/v1/products",
      makeFormData({
        queryParams: [
          {
            name: "statuses",
            value: '["PENDING"]',
            active: true,
            isArray: true,
          },
        ],
      }),
    );
    expect(url.searchParams.getAll("statuses")).toEqual(["PENDING"]);
  });

  it("handles empty array param (no values selected)", () => {
    const url = createUrl(
      "https://api.example.com",
      "/v1/products",
      makeFormData({
        queryParams: [
          {
            name: "statuses",
            value: "",
            active: true,
            isArray: true,
          },
        ],
      }),
    );
    expect(url.searchParams.has("statuses")).toBe(false);
  });

  it("handles array param with plain string value (fallback)", () => {
    const url = createUrl(
      "https://api.example.com",
      "/v1/products",
      makeFormData({
        queryParams: [
          {
            name: "statuses",
            value: "PENDING",
            active: true,
            isArray: true,
          },
        ],
      }),
    );
    expect(url.searchParams.getAll("statuses")).toEqual(["PENDING"]);
  });

  it("allows duplicate non-array params with append", () => {
    const url = createUrl(
      "https://api.example.com",
      "/v1/products",
      makeFormData({
        queryParams: [
          { name: "tag", value: "featured", active: true },
          { name: "tag", value: "new", active: true },
        ],
      }),
    );
    expect(url.searchParams.getAll("tag")).toEqual(["featured", "new"]);
  });

  it("mixes array and scalar params correctly", () => {
    const url = createUrl(
      "https://api.example.com",
      "/v1/products",
      makeFormData({
        queryParams: [
          { name: "page", value: "1", active: true },
          {
            name: "statuses",
            value: '["PENDING","IN_REVIEW"]',
            active: true,
            isArray: true,
          },
          { name: "sort", value: "name", active: true },
        ],
      }),
    );
    expect(url.searchParams.get("page")).toBe("1");
    expect(url.searchParams.getAll("statuses")).toEqual([
      "PENDING",
      "IN_REVIEW",
    ]);
    expect(url.searchParams.get("sort")).toBe("name");
  });

  it("fills path params", () => {
    const url = createUrl(
      "https://api.example.com",
      "/v1/products/{productId}",
      makeFormData({
        pathParams: [{ name: "productId", value: "123" }],
      }),
    );
    expect(url.pathname).toBe("/v1/products/123");
  });
});
