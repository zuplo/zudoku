import { describe, expect, it } from "vitest";
import type { OperationsFragmentFragment } from "../graphql/graphql.js";
import { createHttpSnippet, getConverted } from "./createHttpSnippet.js";

const makeOperation = (
  overrides: Partial<OperationsFragmentFragment> = {},
): OperationsFragmentFragment =>
  ({
    slug: "delete-product",
    method: "delete",
    path: "/products/{productId}",
    contentTypes: [],
    servers: [{ url: "https://api.example.com" }],
    parameters: [],
    requestBody: null,
    responses: [],
    extensions: {},
    ...overrides,
  }) as OperationsFragmentFragment;

const buildSnippet = (operation = makeOperation()) =>
  createHttpSnippet({
    operation,
    selectedServer: "https://api.example.com",
    exampleBody: { mimeType: "application/json" },
  });

describe("getConverted", () => {
  describe("JS fetch snippet with no response body", () => {
    it("removes .then(response => response.json()) when hasResponseBody is false", () => {
      const snippet = buildSnippet();
      const code = getConverted(snippet, "js", { hasResponseBody: false });

      expect(code).not.toContain("response.json()");
      expect(code).toContain("fetch(");
      expect(code).toContain(".catch(");
      expect(code).toContain("console.log(response)");
    });

    it("keeps .then(response => response.json()) when hasResponseBody is true", () => {
      const snippet = buildSnippet();
      const code = getConverted(snippet, "js", { hasResponseBody: true });

      expect(code).toContain("response.json()");
    });

    it("keeps .then(response => response.json()) by default", () => {
      const snippet = buildSnippet();
      const code = getConverted(snippet, "js");

      expect(code).toContain("response.json()");
    });
  });

  describe("non-JS languages are unaffected by hasResponseBody", () => {
    it("shell output is unchanged when hasResponseBody is false", () => {
      const snippet = buildSnippet();
      const withBody = getConverted(snippet, "shell", {
        hasResponseBody: true,
      });
      const withoutBody = getConverted(snippet, "shell", {
        hasResponseBody: false,
      });

      expect(withBody).toBe(withoutBody);
    });

    it("python output is unchanged when hasResponseBody is false", () => {
      const snippet = buildSnippet();
      const withBody = getConverted(snippet, "python", {
        hasResponseBody: true,
      });
      const withoutBody = getConverted(snippet, "python", {
        hasResponseBody: false,
      });

      expect(withBody).toBe(withoutBody);
    });
  });
});
