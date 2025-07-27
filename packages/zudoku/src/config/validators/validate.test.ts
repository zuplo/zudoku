import { describe, expect, it, vi } from "vitest";
import { validateConfig } from "./validate.js";

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

    expect(() =>
      validateConfig(configWithValidAuth0),
    ).toThrowErrorMatchingInlineSnapshot(`
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
});
