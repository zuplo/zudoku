import { describe, expect, it } from "vitest";
import {
  DEFAULT_CONFIGURATION,
  getCdnUrl,
  getHtmlDocument,
  type ZudokuApiReferenceConfiguration,
} from "./index.js";

describe("@zudoku/core", () => {
  describe("getCdnUrl", () => {
    it("returns default CDN URLs when no version specified", () => {
      const urls = getCdnUrl();

      expect(urls.script).toBe(
        "https://cdn.jsdelivr.net/npm/zudoku@latest/standalone/main.js",
      );
      expect(urls.style).toBe(
        "https://cdn.jsdelivr.net/npm/zudoku@latest/standalone/style.css",
      );
    });

    it("returns versioned CDN URLs when version is specified", () => {
      const urls = getCdnUrl("1.0.0");

      expect(urls.script).toBe(
        "https://cdn.jsdelivr.net/npm/zudoku@1.0.0/standalone/main.js",
      );
      expect(urls.style).toBe(
        "https://cdn.jsdelivr.net/npm/zudoku@1.0.0/standalone/style.css",
      );
    });

    it("handles semantic version strings", () => {
      const urls = getCdnUrl("2.3.4-beta.1");

      expect(urls.script).toBe(
        "https://cdn.jsdelivr.net/npm/zudoku@2.3.4-beta.1/standalone/main.js",
      );
      expect(urls.style).toBe(
        "https://cdn.jsdelivr.net/npm/zudoku@2.3.4-beta.1/standalone/style.css",
      );
    });
  });

  describe("DEFAULT_CONFIGURATION", () => {
    it("has correct default pageTitle", () => {
      expect(DEFAULT_CONFIGURATION.pageTitle).toBe("API Documentation");
    });
  });

  describe("getHtmlDocument", () => {
    describe("with URL-based spec", () => {
      it("generates HTML with data-api-url attribute", () => {
        const config: ZudokuApiReferenceConfiguration = {
          spec: { url: "https://example.com/openapi.json" },
        };

        const html = getHtmlDocument(config);

        expect(html).toContain("<!DOCTYPE html>");
        expect(html).toContain('<html lang="en">');
        expect(html).toContain(
          'data-api-url="https://example.com/openapi.json"',
        );
        expect(html).toContain('id="zudoku-root"');
      });

      it("uses default CDN URLs", () => {
        const config: ZudokuApiReferenceConfiguration = {
          spec: { url: "https://example.com/openapi.json" },
        };

        const html = getHtmlDocument(config);

        expect(html).toContain(
          'href="https://cdn.jsdelivr.net/npm/zudoku@latest/standalone/style.css"',
        );
        expect(html).toContain(
          'src="https://cdn.jsdelivr.net/npm/zudoku@latest/standalone/main.js"',
        );
      });
    });

    describe("with custom CDN", () => {
      it("uses custom CDN URLs when specified", () => {
        const config: ZudokuApiReferenceConfiguration = {
          spec: { url: "https://example.com/openapi.json" },
          cdn: "https://custom-cdn.example.com/zudoku",
        };

        const html = getHtmlDocument(config);

        expect(html).toContain(
          'href="https://custom-cdn.example.com/zudoku/style.css"',
        );
        expect(html).toContain(
          'src="https://custom-cdn.example.com/zudoku/main.js"',
        );
      });
    });

    describe("with inline spec content", () => {
      it("embeds spec as JSON when content is an object", () => {
        const specContent = {
          openapi: "3.0.0",
          info: { title: "Test API", version: "1.0.0" },
        };
        const config: ZudokuApiReferenceConfiguration = {
          spec: { content: specContent },
        };

        const html = getHtmlDocument(config);

        expect(html).toContain('id="zudoku-config"');
        expect(html).toContain("application/json");
        expect(html).toContain('"openapi":"3.0.0"');
        expect(html).toContain('"title":"Test API"');
      });

      it("parses and embeds spec when content is a JSON string", () => {
        const specContent = JSON.stringify({
          openapi: "3.0.0",
          info: { title: "Test API", version: "1.0.0" },
        });
        const config: ZudokuApiReferenceConfiguration = {
          spec: { content: specContent },
        };

        const html = getHtmlDocument(config);

        expect(html).toContain('id="zudoku-config"');
        expect(html).toContain('"openapi":"3.0.0"');
      });

      it("includes specUrl in config when both url and content present for inline config", () => {
        const config: ZudokuApiReferenceConfiguration = {
          spec: { url: "https://example.com/openapi.json" },
          logo: { src: "https://example.com/logo.png" },
        };

        const html = getHtmlDocument(config);

        expect(html).toContain('id="zudoku-config"');
        expect(html).toContain('"specUrl":"https://example.com/openapi.json"');
      });
    });

    describe("with logo configuration", () => {
      it("embeds logo configuration with simple src", () => {
        const config: ZudokuApiReferenceConfiguration = {
          spec: { url: "https://example.com/openapi.json" },
          logo: {
            src: "https://example.com/logo.png",
            width: "120px",
          },
        };

        const html = getHtmlDocument(config);

        expect(html).toContain('id="zudoku-config"');
        expect(html).toContain('"src":"https://example.com/logo.png"');
        expect(html).toContain('"width":"120px"');
      });

      it("embeds logo configuration with light/dark variants", () => {
        const config: ZudokuApiReferenceConfiguration = {
          spec: { url: "https://example.com/openapi.json" },
          logo: {
            src: {
              light: "https://example.com/logo-light.png",
              dark: "https://example.com/logo-dark.png",
            },
          },
        };

        const html = getHtmlDocument(config);

        expect(html).toContain('"light":"https://example.com/logo-light.png"');
        expect(html).toContain('"dark":"https://example.com/logo-dark.png"');
      });
    });

    describe("with custom CSS", () => {
      it("includes custom CSS in a style tag", () => {
        const config: ZudokuApiReferenceConfiguration = {
          spec: { url: "https://example.com/openapi.json" },
          customCss: ".custom-class { color: red; }",
        };

        const html = getHtmlDocument(config);

        expect(html).toContain("<style>.custom-class { color: red; }</style>");
      });
    });

    describe("with custom theme", () => {
      it("includes custom theme CSS when provided", () => {
        const config: ZudokuApiReferenceConfiguration = {
          spec: { url: "https://example.com/openapi.json" },
        };
        const customTheme = ":root { --primary-color: blue; }";

        const html = getHtmlDocument(config, customTheme);

        expect(html).toContain(
          "<style>:root { --primary-color: blue; }</style>",
        );
      });

      it("includes both custom theme and custom CSS when both provided", () => {
        const config: ZudokuApiReferenceConfiguration = {
          spec: { url: "https://example.com/openapi.json" },
          customCss: "body { margin: 0; }",
        };
        const customTheme = ":root { --primary-color: blue; }";

        const html = getHtmlDocument(config, customTheme);

        expect(html).toContain(
          "<style>:root { --primary-color: blue; }</style>",
        );
        expect(html).toContain("<style>body { margin: 0; }</style>");
      });
    });

    describe("with metadata", () => {
      it("uses metadata title when provided", () => {
        const config: ZudokuApiReferenceConfiguration = {
          spec: { url: "https://example.com/openapi.json" },
          pageTitle: "Page Title",
          metadata: { title: "Meta Title" },
        };

        const html = getHtmlDocument(config);

        expect(html).toContain("<title>Meta Title</title>");
      });

      it("falls back to pageTitle when metadata title not provided", () => {
        const config: ZudokuApiReferenceConfiguration = {
          spec: { url: "https://example.com/openapi.json" },
          pageTitle: "Custom Page Title",
        };

        const html = getHtmlDocument(config);

        expect(html).toContain("<title>Custom Page Title</title>");
      });

      it("uses default pageTitle when no title provided", () => {
        const config: ZudokuApiReferenceConfiguration = {
          spec: { url: "https://example.com/openapi.json" },
        };

        const html = getHtmlDocument(config);

        expect(html).toContain("<title>API Documentation</title>");
      });

      it("includes meta description when provided", () => {
        const config: ZudokuApiReferenceConfiguration = {
          spec: { url: "https://example.com/openapi.json" },
          metadata: { description: "This is an API description" },
        };

        const html = getHtmlDocument(config);

        expect(html).toContain(
          '<meta name="description" content="This is an API description">',
        );
      });
    });

    describe("with favicon", () => {
      it("includes favicon link when provided", () => {
        const config: ZudokuApiReferenceConfiguration = {
          spec: { url: "https://example.com/openapi.json" },
          favicon: "https://example.com/favicon.ico",
        };

        const html = getHtmlDocument(config);

        expect(html).toContain(
          '<link rel="icon" href="https://example.com/favicon.ico">',
        );
      });
    });

    describe("with integration identifier", () => {
      it("includes data-integration attribute for URL-based config", () => {
        const config: ZudokuApiReferenceConfiguration = {
          spec: { url: "https://example.com/openapi.json" },
          _integration: "express",
        };

        const html = getHtmlDocument(config);

        expect(html).toContain('data-integration="express"');
      });

      it("includes _integration in config object for inline config", () => {
        const config: ZudokuApiReferenceConfiguration = {
          spec: { content: { openapi: "3.0.0" } },
          _integration: "nextjs",
        };

        const html = getHtmlDocument(config);

        expect(html).toContain('"_integration":"nextjs"');
      });
    });

    describe("HTML escaping", () => {
      it("escapes HTML special characters in title", () => {
        const config: ZudokuApiReferenceConfiguration = {
          spec: { url: "https://example.com/openapi.json" },
          pageTitle: '<script>alert("xss")</script>',
        };

        const html = getHtmlDocument(config);

        expect(html).not.toContain("<script>alert");
        expect(html).toContain("&lt;script&gt;alert");
      });

      it("escapes HTML special characters in description", () => {
        const config: ZudokuApiReferenceConfiguration = {
          spec: { url: "https://example.com/openapi.json" },
          metadata: { description: 'Test <img src="x" onerror="alert(1)">' },
        };

        const html = getHtmlDocument(config);

        expect(html).toContain("&lt;img src=");
      });

      it("escapes HTML special characters in spec URL", () => {
        const config: ZudokuApiReferenceConfiguration = {
          spec: { url: 'https://example.com/api?param="value"&other=1' },
        };

        const html = getHtmlDocument(config);

        expect(html).toContain("&amp;other=1");
        expect(html).toContain("&quot;value&quot;");
      });

      it("escapes single quotes", () => {
        const config: ZudokuApiReferenceConfiguration = {
          spec: { url: "https://example.com/openapi.json" },
          pageTitle: "Test's API",
        };

        const html = getHtmlDocument(config);

        expect(html).toContain("Test&#39;s API");
      });

      it("escapes ampersands", () => {
        const config: ZudokuApiReferenceConfiguration = {
          spec: { url: "https://example.com/openapi.json" },
          pageTitle: "Test & API",
        };

        const html = getHtmlDocument(config);

        expect(html).toContain("Test &amp; API");
      });
    });

    describe("HTML structure", () => {
      it("includes required meta tags", () => {
        const config: ZudokuApiReferenceConfiguration = {
          spec: { url: "https://example.com/openapi.json" },
        };

        const html = getHtmlDocument(config);

        expect(html).toContain('<meta charset="UTF-8">');
        expect(html).toContain(
          '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
        );
      });

      it("includes script with type module", () => {
        const config: ZudokuApiReferenceConfiguration = {
          spec: { url: "https://example.com/openapi.json" },
        };

        const html = getHtmlDocument(config);

        expect(html).toContain('type="module"');
      });
    });
  });
});
