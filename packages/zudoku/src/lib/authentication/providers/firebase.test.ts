// @vitest-environment happy-dom
import type { NavigateFunction } from "react-router";
import { describe, expect, test, vi } from "vitest";
import firebaseAuth from "./firebase.js";

vi.mock("firebase/app", () => ({ initializeApp: () => ({}) }));
vi.mock("firebase/auth", () => ({ getAuth: () => ({}) }));

const buildProvider = (
  options: {
    redirectToAfterSignIn?: string;
    redirectToAfterSignUp?: string;
  } = {},
) =>
  firebaseAuth({
    type: "firebase",
    apiKey: "key",
    authDomain: "example.firebaseapp.com",
    projectId: "example",
    appId: "app",
    ...options,
  });

describe("firebase sign-in redirects", () => {
  test("signIn keeps the dynamic redirectTo", async () => {
    const navigate: NavigateFunction = vi.fn();
    await buildProvider().signIn({ navigate }, { redirectTo: "/protected" });
    expect(navigate).toHaveBeenCalledWith("/signin?redirectTo=%2Fprotected");
  });

  test("redirectToAfterSignIn takes precedence over redirectTo", async () => {
    const navigate: NavigateFunction = vi.fn();
    await buildProvider({ redirectToAfterSignIn: "/dashboard" }).signIn(
      { navigate },
      { redirectTo: "/protected" },
    );
    expect(navigate).toHaveBeenCalledWith("/signin?redirectTo=%2Fdashboard");
  });

  test("redirectToAfterSignUp takes precedence over redirectTo", async () => {
    const navigate: NavigateFunction = vi.fn();
    await buildProvider({ redirectToAfterSignUp: "/welcome" }).signUp?.(
      { navigate },
      { redirectTo: "/protected" },
    );
    expect(navigate).toHaveBeenCalledWith("/signup?redirectTo=%2Fwelcome");
  });
});
