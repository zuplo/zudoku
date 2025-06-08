import { describe, expect, it, vi } from "vitest";
import { validateConfig } from "./validate.js";

const mockConsoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

describe("validateConfig", () => {
  afterEach(() => {
    mockConsoleLog.mockClear();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
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

  it("should reject auth0 domain with protocol", () => {
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

  it("should reject auth0 domain that ends with a slash", () => {
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
});
