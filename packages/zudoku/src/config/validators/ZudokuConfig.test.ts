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
      [Error: Whoops, looks like there's an issue with your config:
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
      [Error: Whoops, looks like there's an issue with your config:
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
      [Error: Whoops, looks like there's an issue with your config:
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
});
