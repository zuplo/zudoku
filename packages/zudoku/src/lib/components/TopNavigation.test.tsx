/**
 * @vitest-environment happy-dom
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  render as testRender,
  screen,
  type RenderResult,
} from "@testing-library/react";
import type { PropsWithChildren, ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import type { Navigation } from "../../config/validators/NavigationSchema.js";
import { ZudokuContext } from "../core/ZudokuContext.js";
import { useAuthState } from "../authentication/state.js";
import { SlotProvider } from "./context/SlotProvider.js";
import { ZudokuProvider } from "./context/ZudokuProvider.js";
import { TopNavigation } from "./TopNavigation.js";

const createWrapper = (navigation: Navigation = []) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  const context = new ZudokuContext({ navigation }, queryClient, {});

  const wrapper = ({ children }: PropsWithChildren) => (
    <MemoryRouter initialEntries={["/"]}>
      <QueryClientProvider client={queryClient}>
        <ZudokuProvider context={context}>
          <SlotProvider slots={{}>
            {children}
          </SlotProvider>
        </ZudokuProvider>
      </QueryClientProvider>
    </MemoryRouter>
  );

  return { context, wrapper, queryClient };
};

const render = async (navigation: Navigation = []) => {
  let renderResult: unknown;
  const { wrapper, queryClient } = createWrapper(navigation);

  await act(async () => {
    renderResult = testRender(<TopNavigation />, { wrapper });
  });

  // Cleanup
  return {
    ...(renderResult as RenderResult),
    cleanup: () => queryClient.clear(),
  };
};

describe("TopNavigation", () => {
  it("renders navigation items", async () => {
    const navigation: Navigation = [
      {
        type: "category",
        label: "Documentation",
        items: [
          { type: "doc", file: "intro", label: "Introduction", path: "/intro" },
        ],
      },
      {
        type: "link",
        to: "/api",
        label: "API Reference",
      },
    ];

    const { cleanup } = await render(navigation);

    expect(screen.getByText("Documentation")).toBeInTheDocument();
    expect(screen.getByText("API Reference")).toBeInTheDocument();

    cleanup();
  });

  it("hides items based on display: hide", async () => {
    const navigation: Navigation = [
      {
        type: "link",
        to: "/visible",
        label: "Visible Item",
        display: "always",
      },
      {
        type: "link",
        to: "/hidden",
        label: "Hidden Item",
        display: "hide",
      },
    ];

    const { cleanup } = await render(navigation);

    expect(screen.getByText("Visible Item")).toBeInTheDocument();
    expect(screen.queryByText("Hidden Item")).not.toBeInTheDocument();

    cleanup();
  });

  it("shows auth items only when authenticated", async () => {
    useAuthState.setState({ isAuthenticated: false });

    const navigation: Navigation = [
      {
        type: "link",
        to: "/public",
        label: "Public",
        display: "always",
      },
      {
        type: "link",
        to: "/admin",
        label: "Admin Panel",
        display: "auth",
      },
    ];

    const { cleanup, rerender } = await render(navigation);

    expect(screen.getByText("Public")).toBeInTheDocument();
    expect(screen.queryByText("Admin Panel")).not.toBeInTheDocument();

    // Authenticate and rerender
    act(() => {
      useAuthState.setState({
        isAuthenticated: true,
        profile: { email: "user@example.com" },
      });
    });

    rerender(<TopNavigation />);

    expect(screen.getByText("Public")).toBeInTheDocument();
    expect(screen.getByText("Admin Panel")).toBeInTheDocument();

    // Reset auth state
    useAuthState.setState({ isAuthenticated: false, profile: null });
    cleanup();
  });

  it("shows anon items only when not authenticated", async () => {
    useAuthState.setState({ isAuthenticated: false });

    const navigation: Navigation = [
      {
        type: "link",
        to: "/signin",
        label: "Sign In",
        display: "anon",
      },
    ];

    const { cleanup, rerender } = await render(navigation);

    expect(screen.getByText("Sign In")).toBeInTheDocument();

    // Authenticate
    act(() => {
      useAuthState.setState({
        isAuthenticated: true,
        profile: { email: "user@example.com" },
      });
    });

    rerender(<TopNavigation />);

    expect(screen.queryByText("Sign In")).not.toBeInTheDocument();

    // Reset auth state
    useAuthState.setState({ isAuthenticated: false, profile: null });
    cleanup();
  });

  it("renders separators", async () => {
    const navigation: Navigation = [
      {
        type: "link",
        to: "/docs",
        label: "Docs",
      },
      {
        type: "separator",
        label: "sep-1",
        display: "always",
      },
      {
        type: "link",
        to: "/api",
        label: "API",
      },
    ];

    const { cleanup, container } = await render(navigation);

    expect(screen.getByText("Docs")).toBeInTheDocument();
    expect(screen.getByText("API")).toBeInTheDocument();

    // Separator renders as a horizontal line
    const separator = container.querySelector('[role="separator"]');
    expect(separator).toBeInTheDocument();

    cleanup();
  });

  it("does not render sections or filters in top navigation", async () => {
    const navigation: Navigation = [
      {
        type: "section",
        label: "Section Header",
        display: "always",
      },
      {
        type: "filter",
        label: "filter-1",
        placeholder: "Search",
        display: "always",
      },
      {
        type: "link",
        to: "/docs",
        label: "Documentation",
      },
    ];

    const { cleanup } = await render(navigation);

    // Sections and filters should not appear in top nav
    expect(screen.queryByText("Section Header")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search")).not.toBeInTheDocument();

    // But links should appear
    expect(screen.getByText("Documentation")).toBeInTheDocument();

    cleanup();
  });

  it("renders icons with items", async () => {
    const MockIcon = () => <span data-testid="nav-icon">Icon</span>;

    const navigation: Navigation = [
      {
        type: "link",
        to: "/docs",
        label: "Documentation",
        // @ts-expect-error - Using test icon
        icon: MockIcon,
      },
    ];

    const { cleanup } = await render(navigation);

    expect(screen.getByText("Documentation")).toBeInTheDocument();
    expect(screen.getByTestId("nav-icon")).toBeInTheDocument();

    cleanup();
  });

  it("handles empty navigation", async () => {
    const { cleanup, container } = await render([]);

    // Should render style tag for 0 height
    const styleTag = container.querySelector("style");
    expect(styleTag?.textContent).toContain("--top-nav-height: 0px");

    cleanup();
  });

  it("handles custom display function", async () => {
    useAuthState.setState({
      isAuthenticated: true,
      profile: { email: "admin@example.com", role: "admin" },
    });

    const navigation: Navigation = [
      {
        type: "link",
        to: "/admin",
        label: "Admin Panel",
        display: ({ auth }) => {
          return auth.isAuthenticated && auth.profile?.role === "admin";
        },
      },
      {
        type: "link",
        to: "/user",
        label: "User Panel",
        display: ({ auth }) => {
          return auth.isAuthenticated && auth.profile?.role === "user";
        },
      },
    ];

    const { cleanup } = await render(navigation);

    // Should show admin panel (role is admin)
    expect(screen.getByText("Admin Panel")).toBeInTheDocument();

    // Should not show user panel (role is not user)
    expect(screen.queryByText("User Panel")).not.toBeInTheDocument();

    // Reset auth state
    useAuthState.setState({ isAuthenticated: false, profile: null });
    cleanup();
  });

  it("handles navigation with badges", async () => {
    const navigation: Navigation = [
      {
        type: "link",
        to: "/api",
        label: "API",
        badge: {
          label: "Beta",
          color: "yellow",
        },
      },
    ];

    const { cleanup } = await render(navigation);

    expect(screen.getByText("API")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();

    cleanup();
  });

  it("handles deeply nested categories", async () => {
    const navigation: Navigation = [
      {
        type: "category",
        label: "Guides",
        items: [
          {
            type: "category",
            label: "Advanced",
            items: [
              { type: "doc", file: "perf", label: "Performance", path: "/perf" },
            ],
          },
        ],
      },
    ];

    const { cleanup } = await render(navigation);

    expect(screen.getByText("Guides")).toBeInTheDocument();

    cleanup();
  });
});