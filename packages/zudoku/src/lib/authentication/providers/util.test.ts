// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { redirectToSignUpUrl } from "./util.js";

describe("redirectToSignUpUrl", () => {
  let originalLocation: Location;

  const mockLocation = () => {
    const loc = {
      assign: vi.fn(),
      replace: vi.fn(),
    };
    Object.defineProperty(window, "location", {
      configurable: true,
      value: loc,
    });
    return loc;
  };

  beforeEach(() => {
    originalLocation = window.location;
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
    vi.restoreAllMocks();
  });

  test("absolute URL uses location.assign by default", () => {
    const loc = mockLocation();
    const navigate = vi.fn();

    redirectToSignUpUrl("https://example.com/register", navigate);

    expect(loc.assign).toHaveBeenCalledWith("https://example.com/register");
    expect(loc.replace).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  test("absolute URL with replace=true uses location.replace", () => {
    const loc = mockLocation();
    const navigate = vi.fn();

    redirectToSignUpUrl("https://example.com/register", navigate, true);

    expect(loc.replace).toHaveBeenCalledWith("https://example.com/register");
    expect(loc.assign).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  test("relative path uses navigate", () => {
    const loc = mockLocation();
    const navigate = vi.fn();

    redirectToSignUpUrl("/register", navigate);

    expect(navigate).toHaveBeenCalledWith("/register", { replace: false });
    expect(loc.assign).not.toHaveBeenCalled();
  });

  test("relative path with replace=true forwards replace", () => {
    mockLocation();
    const navigate = vi.fn();

    redirectToSignUpUrl("/register", navigate, true);

    expect(navigate).toHaveBeenCalledWith("/register", { replace: true });
  });
});
