// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import clerkAuth from "./clerk.js";

describe("clerkAuth signUp short-circuit", () => {
  let originalLocation: Location;

  beforeEach(() => {
    originalLocation = window.location;
    document.head.innerHTML = "";
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
    document.head.innerHTML = "";
  });

  test("signUp({ url }) skips Clerk SDK and uses location.assign for absolute URL", async () => {
    const loc = { assign: vi.fn(), replace: vi.fn() };
    Object.defineProperty(window, "location", {
      configurable: true,
      value: loc,
    });

    const provider = clerkAuth({
      type: "clerk",
      // Format only matters for the Zod validator; provider does not parse it
      // unless loadClerk runs. The short-circuit must prevent that.
      clerkPubKey: "pk_test_fake.clerk.dev$" as `pk_test_${string}`,
      jwtTemplateName: "dev-portal",
      signUp: { url: "https://app.example.com/register" },
    });

    await provider.signUp({ navigate: vi.fn() }, {});

    expect(loc.assign).toHaveBeenCalledWith("https://app.example.com/register");
    // No Clerk script should have been injected
    expect(document.head.querySelector("script")).toBeNull();
  });

  test("signUp({ url }) with relative path uses navigate, no SDK load", async () => {
    const navigate = vi.fn();

    const provider = clerkAuth({
      type: "clerk",
      clerkPubKey: "pk_test_fake.clerk.dev$" as `pk_test_${string}`,
      jwtTemplateName: "dev-portal",
      signUp: { url: "/register" },
    });

    await provider.signUp({ navigate }, {});

    expect(navigate).toHaveBeenCalledWith("/register", { replace: false });
    expect(document.head.querySelector("script")).toBeNull();
  });
});
