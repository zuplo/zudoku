/**
 * @vitest-environment happy-dom
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  cleanup,
  render as testRender,
  screen,
} from "@testing-library/react";
import { createMemoryRouter, Outlet, RouterProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ZudokuProvider } from "../../components/context/ZudokuProvider.js";
import { ZudokuContext } from "../../core/ZudokuContext.js";
import type { UseAuthReturn } from "../hook.js";
import { SignUp } from "./SignUp.js";

vi.mock("../hook.js", () => ({
  useAuth: vi.fn(),
}));

const { useAuth } = await import("../hook.js");
const mockUseAuth = vi.mocked(useAuth);

const buildAuth = (overrides: Partial<UseAuthReturn> = {}): UseAuthReturn => ({
  isAuthenticated: false,
  isPending: false,
  isAuthEnabled: true,
  disableSignUp: false,
  profile: null,
  providerData: null,
  setAuthenticationPending: vi.fn(),
  setLoggedOut: vi.fn(),
  setLoggedIn: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  signup: vi.fn(),
  requestEmailVerification: vi.fn(),
  ...overrides,
});

const renderAt = async (path: string) => {
  const queryClient = new QueryClient();
  const context = new ZudokuContext({}, queryClient, {});
  const router = createMemoryRouter(
    [
      {
        element: (
          <QueryClientProvider client={queryClient}>
            <ZudokuProvider context={context}>
              <Outlet />
            </ZudokuProvider>
          </QueryClientProvider>
        ),
        children: [{ path: "/signup", element: <SignUp /> }],
      },
    ],
    { initialEntries: [path] },
  );

  await act(async () => {
    testRender(<RouterProvider router={router} />);
  });
};

describe("SignUp page", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("redirects via signup() when not disabled", async () => {
    const signup = vi.fn();
    mockUseAuth.mockReturnValue(buildAuth({ signup }));

    await renderAt("/signup?redirect=/dashboard");

    expect(signup).toHaveBeenCalledWith({ redirectTo: "/dashboard" });
    expect(screen.queryByText("Invitation required")).not.toBeInTheDocument();
  });

  it("renders disabled UI and does not call signup when disableSignUp is true", async () => {
    const signup = vi.fn();
    mockUseAuth.mockReturnValue(buildAuth({ signup, disableSignUp: true }));

    await renderAt("/signup");

    expect(signup).not.toHaveBeenCalled();
    expect(screen.getByText("Invitation required")).toBeInTheDocument();
  });

  it("falls back to '/' when redirect query param missing", async () => {
    const signup = vi.fn();
    mockUseAuth.mockReturnValue(buildAuth({ signup }));

    await renderAt("/signup");

    expect(signup).toHaveBeenCalledWith({ redirectTo: "/" });
  });
});
