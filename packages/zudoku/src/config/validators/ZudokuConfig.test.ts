import { describe, expect, it, vi } from "vitest";
import { validateConfig } from "./ZudokuConfig.js";

const mockConsoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

describe("validateConfig", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    mockConsoleLog.mockClear();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("should validate auth0 domain format correctly", () => {
    const configWithValidAuth0 = {
      authentication: {
        type: "auth0" as const,
        clientId: "client123",
        domain: "example.auth0.com",
      },
    };

    validateConfig(configWithValidAuth0);

    expect(mockConsoleLog).not.toHaveBeenCalled();
  });

  it("should validate clerk public key format correctly", () => {
    process.env.NODE_ENV = "production";

    const configWithValidAuth0 = {
      authentication: {
        type: "clerk" as const,
        clerkPubKey: "kik",
      },
    };

    expect(() => validateConfig(configWithValidAuth0))
      .toThrowErrorMatchingInlineSnapshot(`
      [Error: Invalid Zudoku configuration:
      ✖ Clerk public key invalid, must start with pk_test or pk_live
        → at authentication.clerkPubKey]
    `);

    expect(mockConsoleLog).not.toHaveBeenCalled();
  });

  it("should validate openid issuer format correctly", () => {
    const configWithValidAuth0 = {
      authentication: {
        type: "openid" as const,
        clientId: "client123",
        issuer: "https://example.auth0.com/",
      },
    };

    validateConfig(configWithValidAuth0);

    expect(mockConsoleLog).not.toHaveBeenCalled();
  });

  it("should validate openid issuer format correctly", () => {
    const configWithValidAuth0 = {
      authentication: {
        type: "openid" as const,
        clientId: "client123",
        issuer: "https://example.auth0.com",
      },
    };

    validateConfig(configWithValidAuth0);

    expect(mockConsoleLog).not.toHaveBeenCalled();
  });

  it("should accept allowInsecureRequests as a boolean in openid config", () => {
    const config = {
      authentication: {
        type: "openid" as const,
        clientId: "client123",
        issuer: "https://example.auth0.com",
        allowInsecureRequests: true,
      },
    };

    validateConfig(config);

    expect(mockConsoleLog).not.toHaveBeenCalled();
  });

  it("should reject non-boolean allowInsecureRequests in openid config", () => {
    process.env.NODE_ENV = "production";

    const config = {
      authentication: {
        type: "openid" as const,
        clientId: "client123",
        issuer: "https://example.auth0.com",
        allowInsecureRequests: "yes" as unknown as boolean,
      },
    };

    expect(() => validateConfig(config)).toThrow();
  });

  it("should validate openid issuer format correctly", () => {
    const configWithValidAuth0 = {
      authentication: {
        type: "openid" as const,
        clientId: "client123",
        issuer: "ftp://example.auth0.com/123123",
      },
    };

    validateConfig(configWithValidAuth0);

    expect(mockConsoleLog).not.toHaveBeenCalled();
  });

  it("should reject auth0 domain with protocol in development mode", () => {
    process.env.NODE_ENV = "development";

    const configWithInvalidAuth0Domain = {
      authentication: {
        type: "auth0" as const,
        clientId: "client123",
        domain: "https://example.auth0.com",
      },
    };

    validateConfig(configWithInvalidAuth0Domain);

    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining("Domain must be a host only"),
    );
  });

  it("should reject auth0 domain that ends with a slash in development mode", () => {
    process.env.NODE_ENV = "development";

    const configWithInvalidAuth0Domain = {
      authentication: {
        type: "auth0" as const,
        clientId: "client123",
        domain: "example.auth0.com/",
      },
    };

    validateConfig(configWithInvalidAuth0Domain);

    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining("Domain must be a host only"),
    );
  });

  it("should throw error for invalid auth0 domain in production mode", () => {
    process.env.NODE_ENV = "production";

    const configWithInvalidAuth0Domain = {
      authentication: {
        type: "auth0" as const,
        clientId: "client123",
        domain: "https://example.auth0.com",
      },
    };

    expect(() =>
      validateConfig(configWithInvalidAuth0Domain),
    ).toThrowErrorMatchingInlineSnapshot(
      `
      [Error: Invalid Zudoku configuration:
      ✖ Domain must be a host only (e.g., 'example.com') without protocol or slashes
        → at authentication.domain]
    `,
    );
  });

  it("should throw error for invalid auth0 domain ending with slash in production mode", () => {
    process.env.NODE_ENV = "production";

    const configWithInvalidAuth0Domain = {
      authentication: {
        type: "auth0" as const,
        clientId: "client123",
        domain: "example.auth0.com/",
      },
    };

    expect(() =>
      validateConfig(configWithInvalidAuth0Domain),
    ).toThrowErrorMatchingInlineSnapshot(
      `
      [Error: Invalid Zudoku configuration:
      ✖ Domain must be a host only (e.g., 'example.com') without protocol or slashes
        → at authentication.domain]
    `,
    );
  });

  it("should include the config path in the error when provided", () => {
    process.env.NODE_ENV = "production";

    const configWithInvalidAuth0Domain = {
      authentication: {
        type: "auth0" as const,
        clientId: "client123",
        domain: "https://example.auth0.com",
      },
    };

    expect(() =>
      validateConfig(configWithInvalidAuth0Domain, "zudoku.config.ts"),
    ).toThrowErrorMatchingInlineSnapshot(
      `
      [Error: Invalid Zudoku configuration at zudoku.config.ts:
      ✖ Domain must be a host only (e.g., 'example.com') without protocol or slashes
        → at authentication.domain]
    `,
    );
  });

  it("should handle undefined NODE_ENV gracefully", () => {
    delete process.env.NODE_ENV;

    const configWithInvalidAuth0Domain = {
      authentication: {
        type: "auth0" as const,
        clientId: "client123",
        domain: "https://example.auth0.com",
      },
    };

    // Should log warnings when NODE_ENV is undefined (development-like behavior)
    validateConfig(configWithInvalidAuth0Domain);

    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining("Domain must be a host only"),
    );
  });

  it("should accept auth0 config with prompt option", () => {
    const configWithPrompt = {
      authentication: {
        type: "auth0" as const,
        clientId: "client123",
        domain: "example.auth0.com",
        options: {
          prompt: "consent",
        },
      },
    };

    validateConfig(configWithPrompt);

    expect(mockConsoleLog).not.toHaveBeenCalled();
  });

  it("should accept auth0 config with empty string prompt option", () => {
    const configWithEmptyPrompt = {
      authentication: {
        type: "auth0" as const,
        clientId: "client123",
        domain: "example.auth0.com",
        options: {
          prompt: "",
        },
      },
    };

    validateConfig(configWithEmptyPrompt);

    expect(mockConsoleLog).not.toHaveBeenCalled();
  });

  it("should accept auth0 config with both alwaysPromptLogin and prompt options", () => {
    const configWithBothOptions = {
      authentication: {
        type: "auth0" as const,
        clientId: "client123",
        domain: "example.auth0.com",
        options: {
          alwaysPromptLogin: false,
          prompt: "select_account",
        },
      },
    };

    validateConfig(configWithBothOptions);

    expect(mockConsoleLog).not.toHaveBeenCalled();
  });

  it("should accept schemaDownload with only enabled", () => {
    const config = {
      apis: {
        type: "url" as const,
        input: "https://example.com/openapi.json",
        options: { schemaDownload: { enabled: true } },
      },
    };

    validateConfig(config);

    expect(mockConsoleLog).not.toHaveBeenCalled();
  });

  it.each([true, false])(
    "should accept header.themeSwitcher.enabled with %s",
    (enabled) => {
      const config = {
        header: {
          themeSwitcher: {
            enabled,
          },
        },
      };

      validateConfig(config);

      expect(mockConsoleLog).not.toHaveBeenCalled();
    },
  );

  it("should accept header.themeSwitcher when undefined", () => {
    const config = {
      header: {
        themeSwitcher: undefined,
      },
    };

    validateConfig(config);

    expect(mockConsoleLog).not.toHaveBeenCalled();
  });

  it('should accept metadata robots values like "noindex, nofollow"', () => {
    const config = {
      metadata: {
        robots: "noindex, nofollow",
      },
    };

    validateConfig(config);

    expect(mockConsoleLog).not.toHaveBeenCalled();
  });

  it("should accept aiAssistants with preset strings", () => {
    const config = {
      aiAssistants: ["claude", "chatgpt"],
    };

    validateConfig(config);

    expect(mockConsoleLog).not.toHaveBeenCalled();
  });

  it("should accept aiAssistants set to false", () => {
    const config = {
      aiAssistants: false as const,
    };

    validateConfig(config);

    expect(mockConsoleLog).not.toHaveBeenCalled();
  });

  it("should accept aiAssistants with custom entries", () => {
    const config = {
      aiAssistants: [
        "claude",
        {
          label: "Open in MyAI",
          url: "https://myai.com/?context={pageUrl}",
        },
      ],
    };

    validateConfig(config);

    expect(mockConsoleLog).not.toHaveBeenCalled();
  });

  it("should accept aiAssistants with callback url", () => {
    const config = {
      aiAssistants: [
        {
          label: "Open in MyAI",
          url: ({ pageUrl }: { pageUrl: string }) =>
            `https://myai.com/?q=${pageUrl}`,
        },
      ],
    };

    validateConfig(config);

    expect(mockConsoleLog).not.toHaveBeenCalled();
  });

  it("should reject invalid aiAssistants preset", () => {
    process.env.NODE_ENV = "production";

    const config = {
      aiAssistants: ["invalid-preset"],
    };

    expect(() => validateConfig(config)).toThrow();
  });

  it("should warn when the deprecated UNSAFE_slotlets option is used", () => {
    process.env.NODE_ENV = "development";

    const config = {
      UNSAFE_slotlets: {},
    };

    validateConfig(config);

    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining(
        "deprecated and will be removed soon: UNSAFE_slotlets",
      ),
    );
  });

  it("should not warn about UNSAFE_ options that are not whitelisted", () => {
    process.env.NODE_ENV = "development";

    const config = {
      UNSAFE_somethingElse: true,
    };

    validateConfig(config);

    expect(mockConsoleLog).not.toHaveBeenCalled();
  });

  it("should not warn when no deprecated option is used", () => {
    process.env.NODE_ENV = "development";

    const config = {
      aiAssistants: ["claude"],
    };

    validateConfig(config);

    expect(mockConsoleLog).not.toHaveBeenCalled();
  });
});

describe("validateConfig parsed result", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("applies docs defaults when docs is omitted", () => {
    const result = validateConfig({});

    expect(result.docs.publishMarkdown).toBe(true);
    expect(result.docs.files).toEqual(["/pages/**/*.{md,mdx}"]);
    expect(result.docs.llms).toEqual({
      llmsTxt: false,
      llmsTxtFull: false,
      includeProtected: false,
    });
  });

  it("transforms docs.files string into an array", () => {
    const result = validateConfig({ docs: { files: "/docs/**/*.md" } });

    expect(result.docs.files).toEqual(["/docs/**/*.md"]);
    expect(result.docs.publishMarkdown).toBe(true);
  });

  it("transforms cdnUrl string into a base/media object", () => {
    const result = validateConfig({ cdnUrl: "https://cdn.example.com" });

    expect(result.cdnUrl).toEqual({
      base: "https://cdn.example.com",
      media: "https://cdn.example.com",
    });
  });

  it("normalizes protectedRoutes array into a record of callbacks", () => {
    const result = validateConfig({ protectedRoutes: ["/private/*"] });

    expect(Object.keys(result.protectedRoutes ?? {})).toEqual(["/private/*"]);
    expect(typeof result.protectedRoutes?.["/private/*"]).toBe("function");
  });

  it("leaves clerk jwtTemplateName absent when omitted", () => {
    const result = validateConfig({
      authentication: { type: "clerk", clerkPubKey: "pk_test_abc" },
    });

    expect(result.authentication).not.toHaveProperty("jwtTemplateName");
  });

  it("preserves plugin instances by reference", () => {
    const plugin = { getRoutes: () => [] };
    const result = validateConfig({ plugins: [plugin] });

    expect(result.plugins?.[0]).toBe(plugin);
  });

  it("keeps raw values for invalid sections and resolves the remainder in dev", () => {
    process.env.NODE_ENV = "development";
    // The file-level spy is restored by the first describe's afterAll.
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});

    const result = validateConfig({
      authentication: { type: "auth0", clientId: "x", domain: "invalid" },
      basePath: "/docs",
    });

    expect(spy).toHaveBeenCalled();
    expect(result.authentication).toMatchObject({
      type: "auth0",
      domain: "invalid",
    });
    expect(result.basePath).toBe("/docs");
    expect(result.docs.publishMarkdown).toBe(true);
    spy.mockRestore();
  });

  it("keeps nested defaults when an invalid section is merged back in dev", () => {
    process.env.NODE_ENV = "development";
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});

    const result = validateConfig({
      docs: { publishMarkdown: "no" },
    });

    // Raw invalid value survives, but sibling defaults stay resolved so
    // consumers like `config.docs.llms.llmsTxt` don't crash.
    expect(result.docs.publishMarkdown).toBe("no");
    expect(result.docs.files).toEqual(["/pages/**/*.{md,mdx}"]);
    expect(result.docs.llms).toEqual({
      llmsTxt: false,
      llmsTxtFull: false,
      includeProtected: false,
    });
    spy.mockRestore();
  });
});
