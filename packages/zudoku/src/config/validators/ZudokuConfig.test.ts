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
