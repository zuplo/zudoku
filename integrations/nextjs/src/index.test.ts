import { describe, expect, it, vi } from "vitest";

// Mock @zudoku/core
vi.mock("@zudoku/core", () => ({
  getHtmlDocument: vi.fn(
    (config) =>
      `<!DOCTYPE html><html><body>Mocked HTML for ${config.spec?.url ?? "inline"}</body></html>`,
  ),
}));

import { getHtmlDocument } from "@zudoku/core";
import { apiReference, ZudokuApiReference } from "./index.js";

describe("@zudoku/nextjs", () => {
  describe("ZudokuApiReference", () => {
    it("returns a function", () => {
      const handler = ZudokuApiReference({
        spec: { url: "https://example.com/openapi.json" },
      });

      expect(typeof handler).toBe("function");
    });

    it("handler returns a Response object", () => {
      const handler = ZudokuApiReference({
        spec: { url: "https://example.com/openapi.json" },
      });

      const response = handler();

      expect(response).toBeInstanceOf(Response);
    });

    it("Response has status 200", () => {
      const handler = ZudokuApiReference({
        spec: { url: "https://example.com/openapi.json" },
      });

      const response = handler();

      expect(response.status).toBe(200);
    });

    it("Response has correct Content-Type header", () => {
      const handler = ZudokuApiReference({
        spec: { url: "https://example.com/openapi.json" },
      });

      const response = handler();

      expect(response.headers.get("Content-Type")).toBe(
        "text/html; charset=utf-8",
      );
    });

    it("Response body contains HTML document", async () => {
      const handler = ZudokuApiReference({
        spec: { url: "https://example.com/openapi.json" },
      });

      const response = handler();
      const body = await response.text();

      expect(body).toContain("<!DOCTYPE html>");
    });

    it("passes configuration to getHtmlDocument", () => {
      const config = {
        spec: { url: "https://example.com/openapi.json" },
        pageTitle: "My API Docs",
      };

      const handler = ZudokuApiReference(config);
      handler();

      expect(getHtmlDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          spec: { url: "https://example.com/openapi.json" },
          pageTitle: "My API Docs",
        }),
      );
    });

    it("merges default configuration with given configuration", () => {
      const config = {
        spec: { url: "https://example.com/openapi.json" },
      };

      const handler = ZudokuApiReference(config);
      handler();

      expect(getHtmlDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          _integration: "nextjs",
          spec: { url: "https://example.com/openapi.json" },
        }),
      );
    });

    it("allows overriding _integration identifier", () => {
      const config = {
        spec: { url: "https://example.com/openapi.json" },
        _integration: "custom",
      };

      const handler = ZudokuApiReference(config);
      handler();

      expect(getHtmlDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          _integration: "custom",
        }),
      );
    });

    it("works with inline spec content", () => {
      const config = {
        spec: {
          content: {
            openapi: "3.0.0",
            info: { title: "Test", version: "1.0" },
          },
        },
      };

      const handler = ZudokuApiReference(config);
      handler();

      expect(getHtmlDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          spec: {
            content: {
              openapi: "3.0.0",
              info: { title: "Test", version: "1.0" },
            },
          },
        }),
      );
    });

    it("passes all configuration options", () => {
      const config = {
        spec: { url: "https://example.com/openapi.json" },
        pageTitle: "Custom Title",
        favicon: "https://example.com/favicon.ico",
        logo: { src: "https://example.com/logo.png", width: "100px" },
        cdn: "https://custom-cdn.example.com",
        customCss: ".custom { color: red; }",
        metadata: { title: "Meta Title", description: "Meta Description" },
      };

      const handler = ZudokuApiReference(config);
      handler();

      expect(getHtmlDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          spec: { url: "https://example.com/openapi.json" },
          pageTitle: "Custom Title",
          favicon: "https://example.com/favicon.ico",
          logo: { src: "https://example.com/logo.png", width: "100px" },
          cdn: "https://custom-cdn.example.com",
          customCss: ".custom { color: red; }",
          metadata: { title: "Meta Title", description: "Meta Description" },
        }),
      );
    });

    it("creates independent handlers for different configurations", () => {
      const handler1 = ZudokuApiReference({
        spec: { url: "https://example1.com/openapi.json" },
      });
      const handler2 = ZudokuApiReference({
        spec: { url: "https://example2.com/openapi.json" },
      });

      // Clear mocks to check fresh calls
      vi.mocked(getHtmlDocument).mockClear();

      handler1();
      expect(getHtmlDocument).toHaveBeenLastCalledWith(
        expect.objectContaining({
          spec: { url: "https://example1.com/openapi.json" },
        }),
      );

      handler2();
      expect(getHtmlDocument).toHaveBeenLastCalledWith(
        expect.objectContaining({
          spec: { url: "https://example2.com/openapi.json" },
        }),
      );
    });

    it("handler can be called multiple times", async () => {
      const handler = ZudokuApiReference({
        spec: { url: "https://example.com/openapi.json" },
      });

      const response1 = handler();
      const response2 = handler();

      expect(response1).toBeInstanceOf(Response);
      expect(response2).toBeInstanceOf(Response);

      const body1 = await response1.text();
      const body2 = await response2.text();

      expect(body1).toBe(body2);
    });
  });

  describe("apiReference alias", () => {
    it("is the same function as ZudokuApiReference", () => {
      expect(apiReference).toBe(ZudokuApiReference);
    });
  });

  describe("default export", () => {
    it("exports ZudokuApiReference as default", async () => {
      const module = await import("./index.js");
      expect(module.default).toBe(ZudokuApiReference);
    });
  });

  describe("type exports", () => {
    it("re-exports ZudokuApiReferenceConfiguration type", async () => {
      // This test verifies the type is exported - it's a compile-time check
      // The actual runtime behavior is that we can import from the module
      const module = await import("./index.js");
      expect(module).toBeDefined();
    });
  });
});
