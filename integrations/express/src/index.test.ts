import { describe, expect, it, vi } from "vitest";

// Mock @zudoku/core
vi.mock("@zudoku/core", () => ({
  getHtmlDocument: vi.fn(
    (config) =>
      `<!DOCTYPE html><html><body>Mocked HTML for ${config.spec?.url ?? "inline"}</body></html>`,
  ),
}));

import { getHtmlDocument } from "@zudoku/core";
import { apiReference, zudokuApiReference } from "./index.js";

// Mock Express Request and Response
const createMockRequest = () => ({}) as unknown as import("express").Request;

const createMockResponse = () => {
  const res = {
    _type: "",
    _body: "",
    type: vi.fn(function (this: typeof res, contentType: string) {
      this._type = contentType;
      return this;
    }),
    send: vi.fn(function (this: typeof res, body: string) {
      this._body = body;
      return this;
    }),
  };
  return res as unknown as import("express").Response & {
    _type: string;
    _body: string;
  };
};

describe("@zudoku/express", () => {
  describe("zudokuApiReference", () => {
    it("returns a function (middleware)", () => {
      const middleware = zudokuApiReference({
        spec: { url: "https://example.com/openapi.json" },
      });

      expect(typeof middleware).toBe("function");
    });

    it("middleware sets content type to text/html", () => {
      const middleware = zudokuApiReference({
        spec: { url: "https://example.com/openapi.json" },
      });

      const req = createMockRequest();
      const res = createMockResponse();

      middleware(req, res, () => {});

      expect(res.type).toHaveBeenCalledWith("text/html");
    });

    it("middleware sends HTML document", () => {
      const middleware = zudokuApiReference({
        spec: { url: "https://example.com/openapi.json" },
      });

      const req = createMockRequest();
      const res = createMockResponse();

      middleware(req, res, () => {});

      expect(res.send).toHaveBeenCalled();
      expect(res._body).toContain("<!DOCTYPE html>");
    });

    it("passes configuration to getHtmlDocument", () => {
      const config = {
        spec: { url: "https://example.com/openapi.json" },
        pageTitle: "My API Docs",
      };

      const middleware = zudokuApiReference(config);

      const req = createMockRequest();
      const res = createMockResponse();

      middleware(req, res, () => {});

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

      const middleware = zudokuApiReference(config);

      const req = createMockRequest();
      const res = createMockResponse();

      middleware(req, res, () => {});

      expect(getHtmlDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          _integration: "express",
          spec: { url: "https://example.com/openapi.json" },
        }),
      );
    });

    it("allows overriding _integration identifier", () => {
      const config = {
        spec: { url: "https://example.com/openapi.json" },
        _integration: "custom",
      };

      const middleware = zudokuApiReference(config);

      const req = createMockRequest();
      const res = createMockResponse();

      middleware(req, res, () => {});

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

      const middleware = zudokuApiReference(config);

      const req = createMockRequest();
      const res = createMockResponse();

      middleware(req, res, () => {});

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

      const middleware = zudokuApiReference(config);

      const req = createMockRequest();
      const res = createMockResponse();

      middleware(req, res, () => {});

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
  });

  describe("apiReference alias", () => {
    it("is the same function as zudokuApiReference", () => {
      expect(apiReference).toBe(zudokuApiReference);
    });
  });

  describe("default export", () => {
    it("exports zudokuApiReference as default", async () => {
      const module = await import("./index.js");
      expect(module.default).toBe(zudokuApiReference);
    });
  });
});
