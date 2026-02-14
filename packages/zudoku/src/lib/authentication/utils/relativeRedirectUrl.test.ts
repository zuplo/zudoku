import { describe, expect, it, vi } from "vitest";
import { getRelativeRedirectUrl } from "./relativeRedirectUrl.js";

describe("getRelativeRedirectUrl", () => {
  it("returns / for null redirectTo", () => {
    expect(getRelativeRedirectUrl(null)).toBe("/");
  });

  it("returns / for undefined redirectTo", () => {
    expect(getRelativeRedirectUrl(undefined)).toBe("/");
  });

  it("returns / for empty string redirectTo", () => {
    expect(getRelativeRedirectUrl("")).toBe("/");
  });

  it("returns the same path if window is undefined (SSR)", () => {
    const originalWindow = global.window;
    // @ts-expect-error - Testing SSR scenario
    delete global.window;

    expect(getRelativeRedirectUrl("/some/path")).toBe("/some/path");

    global.window = originalWindow;
  });

  it("strips origin from absolute URL", () => {
    const mockWindow = {
      location: {
        origin: "https://example.com",
      },
    };
    vi.stubGlobal("window", mockWindow);

    Object.defineProperty(import.meta, "env", {
      value: { BASE_URL: "/" },
      writable: true,
    });

    expect(
      getRelativeRedirectUrl("https://example.com/docs/getting-started"),
    ).toBe("/docs/getting-started");

    vi.unstubAllGlobals();
  });

  it("strips origin and base path from absolute URL", () => {
    const mockWindow = {
      location: {
        origin: "https://example.com",
      },
    };
    vi.stubGlobal("window", mockWindow);

    Object.defineProperty(import.meta, "env", {
      value: { BASE_URL: "/app" },
      writable: true,
    });

    expect(
      getRelativeRedirectUrl("https://example.com/app/docs/getting-started"),
    ).toBe("/docs/getting-started");

    vi.unstubAllGlobals();
  });

  it("handles trailing slashes in base URL", () => {
    const mockWindow = {
      location: {
        origin: "https://example.com",
      },
    };
    vi.stubGlobal("window", mockWindow);

    Object.defineProperty(import.meta, "env", {
      value: { BASE_URL: "/app/" },
      writable: true,
    });

    expect(
      getRelativeRedirectUrl("https://example.com/app/docs/getting-started"),
    ).toBe("/docs/getting-started");

    vi.unstubAllGlobals();
  });

  it("returns relative path as-is", () => {
    const mockWindow = {
      location: {
        origin: "https://example.com",
      },
    };
    vi.stubGlobal("window", mockWindow);

    Object.defineProperty(import.meta, "env", {
      value: { BASE_URL: "/" },
      writable: true,
    });

    expect(getRelativeRedirectUrl("/docs/getting-started")).toBe(
      "/docs/getting-started",
    );

    vi.unstubAllGlobals();
  });

  it("handles URL with query parameters", () => {
    const mockWindow = {
      location: {
        origin: "https://example.com",
      },
    };
    vi.stubGlobal("window", mockWindow);

    Object.defineProperty(import.meta, "env", {
      value: { BASE_URL: "/" },
      writable: true,
    });

    expect(
      getRelativeRedirectUrl("https://example.com/docs?search=test"),
    ).toBe("/docs?search=test");

    vi.unstubAllGlobals();
  });

  it("handles URL with hash", () => {
    const mockWindow = {
      location: {
        origin: "https://example.com",
      },
    };
    vi.stubGlobal("window", mockWindow);

    Object.defineProperty(import.meta, "env", {
      value: { BASE_URL: "/" },
      writable: true,
    });

    expect(
      getRelativeRedirectUrl("https://example.com/docs#section"),
    ).toBe("/docs#section");

    vi.unstubAllGlobals();
  });

  it("handles different origin URL (external)", () => {
    const mockWindow = {
      location: {
        origin: "https://example.com",
      },
    };
    vi.stubGlobal("window", mockWindow);

    Object.defineProperty(import.meta, "env", {
      value: { BASE_URL: "/" },
      writable: true,
    });

    expect(
      getRelativeRedirectUrl("https://other-domain.com/docs"),
    ).toBe("https://other-domain.com/docs");

    vi.unstubAllGlobals();
  });
});