/**
 * @vitest-environment happy-dom
 */
import type { NavigateFunction } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { waitForSessionSync } = vi.hoisted(() => ({
  waitForSessionSync: vi.fn(() => Promise.resolve<unknown>(undefined)),
}));
vi.mock("../cookie-sync.js", () => ({ waitForSessionSync }));

const { redirectAfterAuth } = await import("./redirectAfterAuth.js");

describe("redirectAfterAuth", () => {
  let assign: ReturnType<typeof vi.fn>;
  let replace: ReturnType<typeof vi.fn>;
  let originalLocation: Location;

  beforeEach(() => {
    vi.clearAllMocks();
    waitForSessionSync.mockReturnValue(Promise.resolve(undefined));
    assign = vi.fn();
    replace = vi.fn();
    originalLocation = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { origin: window.location.origin, assign, replace },
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });

  it("navigates client-side without touching window.location in SSG mode", async () => {
    vi.stubEnv("ZUDOKU_HAS_SERVER", "");
    const navigate = vi.fn() as unknown as NavigateFunction;

    await redirectAfterAuth(navigate, "/target", { replace: true });

    expect(navigate).toHaveBeenCalledWith("/target", { replace: true });
    expect(assign).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });

  it("hard-navigates after the cookie sync in SSR mode", async () => {
    vi.stubEnv("ZUDOKU_HAS_SERVER", "true");
    const navigate = vi.fn() as unknown as NavigateFunction;

    await redirectAfterAuth(navigate, "/target");

    expect(waitForSessionSync).toHaveBeenCalled();
    expect(assign).toHaveBeenCalledWith("/target");
    expect(navigate).not.toHaveBeenCalled();
  });

  it("uses location.replace when replace is requested in SSR mode", async () => {
    vi.stubEnv("ZUDOKU_HAS_SERVER", "true");

    await redirectAfterAuth(vi.fn() as unknown as NavigateFunction, "/target", {
      replace: true,
    });

    expect(replace).toHaveBeenCalledWith("/target");
    expect(assign).not.toHaveBeenCalled();
  });

  it("prepends the app base so a hard nav stays inside basePath", async () => {
    vi.stubEnv("ZUDOKU_HAS_SERVER", "true");
    vi.stubEnv("BASE_URL", "/docs/");

    await redirectAfterAuth(
      vi.fn() as unknown as NavigateFunction,
      "/protected",
    );

    expect(assign).toHaveBeenCalledWith("/docs/protected");
  });

  it("stays same-origin when BASE_URL is an absolute CDN url", async () => {
    vi.stubEnv("ZUDOKU_HAS_SERVER", "true");
    vi.stubEnv("BASE_URL", "https://cdn.example.com/docs/");

    await redirectAfterAuth(
      vi.fn() as unknown as NavigateFunction,
      "/protected",
    );

    expect(assign).toHaveBeenCalledWith("/docs/protected");
  });

  it("waits for the cookie sync before navigating", async () => {
    vi.stubEnv("ZUDOKU_HAS_SERVER", "true");
    let resolveSync: () => void = () => {};
    waitForSessionSync.mockReturnValue(
      new Promise<unknown>((resolve) => {
        resolveSync = () => resolve(undefined);
      }),
    );

    const pending = redirectAfterAuth(
      vi.fn() as unknown as NavigateFunction,
      "/target",
    );
    await Promise.resolve();
    expect(assign).not.toHaveBeenCalled();

    resolveSync();
    await pending;
    expect(assign).toHaveBeenCalledWith("/target");
  });
});
