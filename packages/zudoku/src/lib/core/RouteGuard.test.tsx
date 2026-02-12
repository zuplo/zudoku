/**
 * @vitest-environment happy-dom
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  cleanup,
  type RenderResult,
  screen,
  render as testRender,
  waitFor,
  within,
} from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { HelmetProvider } from "@zudoku/react-helmet-async";
import type { PropsWithChildren } from "react";
import { ErrorBoundary } from "react-error-boundary";
import {
  createMemoryRouter,
  Link,
  Outlet,
  Route,
  type RouteObject,
  RouterProvider,
  Routes,
} from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CallbackContext } from "../../config/validators/ProtectedRoutesSchema.js";
import type { UseAuthReturn } from "../authentication/hook.js";
import { useAuthState } from "../authentication/state.js";
import { BypassProtectedRoutesContext } from "../components/context/BypassProtectedRoutesContext.js";
import { ZudokuProvider } from "../components/context/ZudokuProvider.js";
import { ZudokuContext } from "../core/ZudokuContext.js";
import { ensureArray } from "../util/ensureArray.js";
import { RouteGuard } from "./RouteGuard.js";

vi.mock("../authentication/hook.js", () => ({
  useAuth: vi.fn(),
}));

const { useAuth } = await import("../authentication/hook.js");
const mockUseAuth = vi.mocked(useAuth);

type CreateWrapperOptions = {
  auth?: Partial<UseAuthReturn>;
  protectedRoutes?: Record<string, (c: CallbackContext) => boolean>;
  shouldBypass?: boolean;
  initialPath?: string;
  wrapRouteGuard?: boolean;
};

const createWrapper = ({
  auth = {},
  protectedRoutes,
}: CreateWrapperOptions = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const mockAuth: UseAuthReturn = {
    isAuthenticated: false,
    isPending: false,
    isAuthEnabled: false,
    profile: null,
    providerData: null,
    setAuthenticationPending: vi.fn(),
    setLoggedOut: vi.fn(),
    setLoggedIn: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    signup: vi.fn(),
    requestEmailVerification: vi.fn(),
    ...auth,
  };

  mockUseAuth.mockReturnValue(mockAuth);

  const mockAuthentication = {
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    signRequest: vi.fn(),
  };

  const context = new ZudokuContext(
    { protectedRoutes, plugins: [] },
    queryClient,
    {},
  );

  // @ts-expect-error - setting readonly property for test
  context.authentication = mockAuthentication;

  return { context, queryClient, mockAuth, mockAuthentication };
};

const render = async (
  routeObject: RouteObject | RouteObject[],
  options: CreateWrapperOptions = {},
) => {
  const {
    wrapRouteGuard = true,
    shouldBypass = false,
    initialPath = "/",
  } = options;
  const { context, queryClient, mockAuth, mockAuthentication } =
    createWrapper(options);

  const Providers = () => (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ZudokuProvider context={context}>
          <BypassProtectedRoutesContext.Provider value={shouldBypass}>
            <Outlet />
          </BypassProtectedRoutesContext.Provider>
        </ZudokuProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );

  const routes = ensureArray(routeObject);
  const router = createMemoryRouter(
    [
      {
        element: <Providers />,
        children: wrapRouteGuard
          ? [{ element: <RouteGuard />, children: routes }]
          : routes,
      },
    ],
    { initialEntries: [initialPath] },
  );

  let renderResult: unknown;
  await act(async () => {
    renderResult = testRender(<RouterProvider router={router} />);
  });

  return {
    ...(renderResult as RenderResult),
    context,
    mockAuth,
    mockAuthentication,
    router,
  };
};

describe("RouteGuard", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    useAuthState.setState({
      isAuthenticated: false,
      isPending: false,
      profile: null,
      providerData: null,
    });
  });

  describe("bypass mode (SSR/prerendering)", () => {
    it("renders Outlet with search meta tag for protected routes", async () => {
      await render(
        { path: "/protected", element: <div>Protected</div> },
        {
          shouldBypass: true,
          initialPath: "/protected",
          protectedRoutes: { "/protected": () => false },
        },
      );

      expect(screen.getByText("Protected")).toBeInTheDocument();

      // Check for Helmet meta tag
      await waitFor(() => {
        const metaTags = document.querySelectorAll('meta[name="pagefind"]');
        expect(metaTags.length).toBeGreaterThan(0);
      });
    });

    it("renders Outlet without meta tag for non-protected routes", async () => {
      await render(
        { path: "/public", element: <div>Public</div> },
        { shouldBypass: true, initialPath: "/public" },
      );

      expect(screen.getByText("Public")).toBeInTheDocument();

      const metaTags = document.querySelectorAll('meta[name="pagefind"]');
      expect(metaTags.length).toBe(0);
    });
  });

  describe("authentication checks", () => {
    it("throws ZudokuError when protected route exists but auth not enabled", async () => {
      const { context, queryClient } = createWrapper({
        auth: { isAuthEnabled: false },
        protectedRoutes: { "/protected": () => false },
      });

      const Wrapper = ({ children }: PropsWithChildren) => (
        <HelmetProvider>
          <QueryClientProvider client={queryClient}>
            <ZudokuProvider context={context}>
              <BypassProtectedRoutesContext.Provider value={false}>
                {children}
              </BypassProtectedRoutesContext.Provider>
            </ZudokuProvider>
          </QueryClientProvider>
        </HelmetProvider>
      );

      const TestComponent = () => (
        <ErrorBoundary
          fallback={
            <div data-testid="error">Authentication is not enabled</div>
          }
        >
          <Routes>
            <Route element={<RouteGuard />}>
              <Route path="/protected" element={<div>Protected</div>} />
            </Route>
          </Routes>
        </ErrorBoundary>
      );

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const router = createMemoryRouter(
        [
          {
            element: (
              <Wrapper>
                <TestComponent />
              </Wrapper>
            ),
            path: "*",
          },
        ],
        { initialEntries: ["/protected"] },
      );

      await act(async () => {
        testRender(<RouterProvider router={router} />);
      });

      const errorElement = screen.getByTestId("error");
      expect(errorElement).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it("returns null when needs sign in and auth is pending", async () => {
      const { container } = await render(
        { path: "/protected", element: <div>Protected</div> },
        {
          initialPath: "/protected",
          auth: {
            isAuthEnabled: true,
            isPending: true,
            isAuthenticated: false,
          },
          protectedRoutes: { "/protected": () => false },
        },
      );

      expect(container.firstChild).toBeNull();
    });

    it("shows login dialog when user needs to sign in", async () => {
      await render(
        { path: "/protected", element: <div>Protected</div> },
        {
          initialPath: "/protected",
          auth: {
            isAuthEnabled: true,
            isPending: false,
            isAuthenticated: false,
          },
          protectedRoutes: { "/protected": () => false },
        },
      );

      const dialog = screen.getByRole("dialog");
      expect(within(dialog).getByText("Login to continue")).toBeInTheDocument();
      expect(
        within(dialog).getByText("Please login to access this page."),
      ).toBeInTheDocument();
      expect(
        within(dialog).getByRole("button", { name: "Login" }),
      ).toBeInTheDocument();
      expect(
        within(dialog).getByRole("button", { name: "Register" }),
      ).toBeInTheDocument();
      expect(
        within(dialog).getByRole("button", { name: "Cancel" }),
      ).toBeInTheDocument();
    });

    it("calls login when login button clicked", async () => {
      const { mockAuth } = await render(
        { path: "/protected", element: <div>Protected</div> },
        {
          initialPath: "/protected",
          auth: {
            isAuthEnabled: true,
            isPending: false,
            isAuthenticated: false,
          },
          protectedRoutes: { "/protected": () => false },
        },
      );

      const dialog = screen.getByRole("dialog");
      const loginButton = within(dialog).getByRole("button", { name: "Login" });
      await userEvent.click(loginButton);

      expect(mockAuth.login).toHaveBeenCalledWith(
        expect.objectContaining({ redirectTo: "/protected" }),
      );
    });

    it("calls signup when register button clicked", async () => {
      const { mockAuth } = await render(
        { path: "/protected", element: <div>Protected</div> },
        {
          initialPath: "/protected",
          auth: {
            isAuthEnabled: true,
            isPending: false,
            isAuthenticated: false,
          },
          protectedRoutes: { "/protected": () => false },
        },
      );

      const dialog = screen.getByRole("dialog");
      const registerButton = within(dialog).getByRole("button", {
        name: "Register",
      });
      await userEvent.click(registerButton);

      expect(mockAuth.signup).toHaveBeenCalledWith(
        expect.objectContaining({ redirectTo: "/protected" }),
      );
    });

    it("renders protected when auth check passes", async () => {
      await render(
        { path: "/protected", element: <div>Protected</div> },
        {
          initialPath: "/protected",
          auth: {
            isAuthEnabled: true,
            isPending: false,
            isAuthenticated: true,
            profile: {
              sub: "123",
              email: "test@example.com",
              emailVerified: false,
              name: "Test",
              pictureUrl: undefined,
            },
          },
          protectedRoutes: {
            "/protected": ({ auth }: CallbackContext) => auth.isAuthenticated,
          },
        },
      );

      expect(screen.getByText("Protected")).toBeInTheDocument();
    });

    it("passes auth and context to authCheckFn", async () => {
      const authCheckFn = vi.fn(() => true);

      await render(
        { path: "/protected", element: <div>Protected</div> },
        {
          initialPath: "/protected",
          auth: {
            isAuthEnabled: true,
            isPending: false,
            isAuthenticated: true,
          },
          protectedRoutes: { "/protected": authCheckFn },
        },
      );

      expect(authCheckFn).toHaveBeenCalledWith(
        expect.objectContaining({
          auth: expect.objectContaining({
            isAuthenticated: true,
            isAuthEnabled: true,
          }),
          context: expect.any(ZudokuContext),
        }),
      );
    });
  });

  describe("non-protected routes", () => {
    it("renders Outlet for public routes", async () => {
      await render(
        { path: "/public", element: <div>Public</div> },
        { auth: { isAuthEnabled: true }, initialPath: "/public" },
      );

      expect(screen.getByText("Public")).toBeInTheDocument();
    });

    it("renders Outlet when no protected routes configured", async () => {
      await render(
        { path: "/any", element: <div>Any Content</div> },
        { initialPath: "/any" },
      );

      expect(screen.getByText("Any Content")).toBeInTheDocument();
    });
  });

  describe("path matching", () => {
    it("matches exact paths with end: true", async () => {
      await render(
        { path: "/protected/nested", element: <div>Protected</div> },
        {
          initialPath: "/protected/nested",
          auth: {
            isAuthEnabled: true,
            isPending: false,
            isAuthenticated: false,
          },
          protectedRoutes: { "/protected/nested": () => false },
        },
      );

      const dialog = screen.getByRole("dialog");
      expect(within(dialog).getByText("Login to continue")).toBeInTheDocument();
    });

    it("does not match partial paths", async () => {
      await render(
        { path: "/protected/extra", element: <div>Public</div> },
        {
          initialPath: "/protected/extra",
          auth: { isAuthEnabled: true },
          protectedRoutes: { "/protected": () => false },
        },
      );

      // Should render content because path doesn't match exactly
      expect(screen.getByText("Public")).toBeInTheDocument();
    });
  });

  describe("navigation blocking", () => {
    const navBlockingOptions: CreateWrapperOptions = {
      auth: { isAuthEnabled: true, isPending: false, isAuthenticated: false },
      protectedRoutes: { "/protected": () => false },
      initialPath: "/",
    };

    const navRoutes: RouteObject[] = [
      {
        path: "/",
        element: (
          <div>
            Public <Link to="/protected">Go</Link>
          </div>
        ),
      },
      { path: "/protected", element: <div>Protected</div> },
    ];

    it("blocks navigation and shows dialog while keeping current page", async () => {
      const { mockAuth } = await render(navRoutes, navBlockingOptions);

      expect(screen.getByText("Public")).toBeInTheDocument();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      await userEvent.click(screen.getByText("Go"));

      // Dialog appears, but still on public page
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Public")).toBeInTheDocument();

      await userEvent.click(screen.getByRole("button", { name: "Login" }));
      expect(mockAuth.login).toHaveBeenCalledWith({ redirectTo: "/protected" });
    });

    it("resets blocker when cancel clicked", async () => {
      await render(navRoutes, navBlockingOptions);

      await userEvent.click(screen.getByText("Go"));
      await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
      expect(screen.getByText("Public")).toBeInTheDocument();
    });
  });
});
