import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createUrl } from "./createUrl.js";
import type { PlaygroundForm } from "./Playground.js";
import { parseArrayParamValue } from "./serializeQueryParams.js";

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
  urlencodedFormFields: [],
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

  it("expands array params with form+explode (default)", () => {
    const url = createUrl(
      "https://api.example.com",
      "/v1/products",
      makeFormData({
        queryParams: [
          {
            name: "statuses",
            value: '["PENDING","IN_REVIEW"]',
            active: true,
            type: "array",
          },
        ],
      }),
    );
    expect(url.searchParams.getAll("statuses")).toEqual([
      "PENDING",
      "IN_REVIEW",
    ]);
  });

  it("handles form+explode:false (comma-separated)", () => {
    const url = createUrl(
      "https://api.example.com",
      "/v1/products",
      makeFormData({
        queryParams: [
          {
            name: "statuses",
            value: '["PENDING","IN_REVIEW"]',
            active: true,
            type: "array",
            style: "form",
            explode: false,
          },
        ],
      }),
    );
    expect(url.search).toBe("?statuses=PENDING,IN_REVIEW");
  });

  it("handles spaceDelimited style", () => {
    const url = createUrl(
      "https://api.example.com",
      "/v1/products",
      makeFormData({
        queryParams: [
          {
            name: "ids",
            value: '["1","2","3"]',
            active: true,
            type: "array",
            style: "spaceDelimited",
          },
        ],
      }),
    );
    expect(url.search).toBe("?ids=1%202%203");
  });

  it("handles pipeDelimited style", () => {
    const url = createUrl(
      "https://api.example.com",
      "/v1/products",
      makeFormData({
        queryParams: [
          {
            name: "ids",
            value: '["1","2","3"]',
            active: true,
            type: "array",
            style: "pipeDelimited",
          },
        ],
      }),
    );
    expect(url.search).toBe("?ids=1|2|3");
  });

  it("handles deepObject style", () => {
    const url = createUrl(
      "https://api.example.com",
      "/v1/products",
      makeFormData({
        queryParams: [
          {
            name: "ids",
            value: '["a","b"]',
            active: true,
            type: "array",
            style: "deepObject",
            explode: true,
          },
        ],
      }),
    );
    expect(url.search).toBe("?ids%5B0%5D=a&ids%5B1%5D=b");
  });

  it("handles allowReserved", () => {
    const url = createUrl(
      "https://api.example.com",
      "/v1/products",
      makeFormData({
        queryParams: [
          {
            name: "filter",
            value: "a/b:c",
            active: true,
            allowReserved: true,
          },
        ],
      }),
    );
    expect(url.search).toBe("?filter=a/b:c");
  });

  it("allowReserved still encodes # and &", () => {
    const url = createUrl(
      "https://api.example.com",
      "/v1/products",
      makeFormData({
        queryParams: [
          {
            name: "filter",
            value: "a#b&c",
            active: true,
            allowReserved: true,
          },
        ],
      }),
    );
    expect(url.search).toBe("?filter=a%23b%26c");
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
            type: "array",
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
            type: "array",
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
            type: "array",
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
            type: "array",
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

  it.each(["https://api.example.com/v1", "https://api.example.com/v1/"])(
    "keeps the server path of %s",
    (host) => {
      const url = createUrl(host, "/users/{id}/", makeFormData());
      expect(url.toString()).toBe("https://api.example.com/v1/users/%7Bid%7D/");
    },
  );

  it.each(["https://api.example.com/v1", "https://api.example.com/v1/"])(
    "keeps the host of %s for paths with a colon",
    (host) => {
      const url = createUrl(host, "/users:check_login", makeFormData());
      expect(url.toString()).toBe(
        "https://api.example.com/v1/users:check_login",
      );
    },
  );

  it("keeps a colon after a path param literal", () => {
    const url = createUrl(
      "https://api.example.com/v1",
      "/jobs/{name}:cancel",
      makeFormData({
        pathParams: [
          { name: "name", value: "a" },
          { name: "cancel", value: "b" },
        ],
      }),
    );
    expect(url.pathname).toBe("/v1/jobs/a:cancel");
  });

  it("does not treat a colon inside a segment as a param", () => {
    const url = createUrl(
      "https://api.example.com/v1",
      "/users:check_login",
      makeFormData({ pathParams: [{ name: "check_login", value: "x" }] }),
    );
    expect(url.pathname).toBe("/v1/users:check_login");
  });

  it("fills Express-style path params", () => {
    const url = createUrl(
      "https://api.example.com/v1",
      "/users/:id/posts",
      makeFormData({ pathParams: [{ name: "id", value: "42" }] }),
    );
    expect(url.pathname).toBe("/v1/users/42/posts");
  });

  it("fills path params with non-word characters in their name", () => {
    const url = createUrl(
      "https://api.example.com/v1",
      "/users/{user-id}/{user.name}",
      makeFormData({
        pathParams: [
          { name: "user-id", value: "42" },
          { name: "user.name", value: "ada" },
        ],
      }),
    );
    expect(url.pathname).toBe("/v1/users/42/ada");
  });

  it.each([
    ["a?b", "a%3Fb"],
    ["a#b", "a%23b"],
    ["a/b", "a%2Fb"],
    ["../../admin", "..%2F..%2Fadmin"],
    ["projects:foo", "projects%3Afoo"],
  ])("encodes the path param value %s", (value, encoded) => {
    const url = createUrl(
      "https://api.example.com/v1",
      "/{id}/posts",
      makeFormData({
        pathParams: [{ name: "id", value }],
        queryParams: [{ name: "x", value: "1", active: true }],
      }),
    );
    expect(url.toString()).toBe(
      `https://api.example.com/v1/${encoded}/posts?x=1`,
    );
  });

  it("keeps the placeholder for empty path params", () => {
    const url = createUrl(
      "https://api.example.com/v1",
      "/products/{productId}",
      makeFormData({ pathParams: [{ name: "productId", value: "" }] }),
    );
    expect(url.pathname).toBe("/v1/products/%7BproductId%7D");
  });

  it("keeps query strings from the server and the path", () => {
    const url = createUrl(
      "https://api.example.com/v1?key=1",
      "/photos?albumId=2",
      makeFormData({
        queryParams: [{ name: "page", value: "3", active: true }],
      }),
    );
    expect(url.toString()).toBe(
      "https://api.example.com/v1/photos?key=1&albumId=2&page=3",
    );
  });

  describe("relative servers", () => {
    beforeEach(() => {
      vi.stubGlobal("window", {
        location: { href: "https://docs.example.com/docs/api/users" },
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("resolves a relative server against the page", () => {
      const url = createUrl("/api", "/users", makeFormData());
      expect(url.toString()).toBe("https://docs.example.com/api/users");
    });

    it("uses the page origin when there is no server", () => {
      const url = createUrl("", "/users", makeFormData());
      expect(url.toString()).toBe("https://docs.example.com/users");
    });
  });
});
