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
import type { NavigationItem as NavigationItemType } from "../../../config/validators/NavigationSchema.js";
import { ZudokuContext } from "../../core/ZudokuContext.js";
import { useAuthState } from "../../authentication/state.js";
import { SlotProvider } from "../context/SlotProvider.js";
import { ZudokuProvider } from "../context/ZudokuProvider.js";
import { ViewportAnchorProvider } from "../context/ViewportAnchorContext.js";
import { NavigationFilterProvider } from "./NavigationFilterContext.js";
import { NavigationItem } from "./NavigationItem.js";

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  const context = new ZudokuContext({}, queryClient, {});

  const wrapper = ({ children }: PropsWithChildren) => (
    <MemoryRouter initialEntries={["/"]}>
      <QueryClientProvider client={queryClient}>
        <ZudokuProvider context={context}>
          <SlotProvider slots={{}}>
            <ViewportAnchorProvider>
              <NavigationFilterProvider>
                {children}
              </NavigationFilterProvider>
            </ViewportAnchorProvider>
          </SlotProvider>
        </ZudokuProvider>
      </QueryClientProvider>
    </MemoryRouter>
  );

  return { context, wrapper };
};

const render = async (element: ReactNode) => {
  let renderResult: unknown;
  const { wrapper } = createWrapper();

  await act(async () => {
    renderResult = testRender(element, { wrapper });
  });

  return renderResult as RenderResult;
};

describe("NavigationItem", () => {
  describe("doc type", () => {
    it("renders doc item with label", async () => {
      const item: NavigationItemType = {
        type: "doc",
        file: "test",
        label: "Test Document",
        path: "/test",
      };

      await render(<NavigationItem item={item} />);

      expect(screen.getByText("Test Document")).toBeInTheDocument();
    });

    it("renders doc item with icon", async () => {
      const MockIcon = () => <span data-testid="doc-icon">Icon</span>;
      const item: NavigationItemType = {
        type: "doc",
        file: "test",
        label: "Test Document",
        path: "/test",
        // @ts-expect-error - Using test icon
        icon: MockIcon,
      };

      await render(<NavigationItem item={item} />);

      expect(screen.getByTestId("doc-icon")).toBeInTheDocument();
    });

    it("renders doc item with badge", async () => {
      const item: NavigationItemType = {
        type: "doc",
        file: "test",
        label: "New Feature",
        path: "/test",
        badge: {
          label: "Beta",
          color: "yellow",
        },
      };

      await render(<NavigationItem item={item} />);

      expect(screen.getByText("New Feature")).toBeInTheDocument();
      expect(screen.getByText("Beta")).toBeInTheDocument();
    });
  });

  describe("link type", () => {
    it("renders internal link", async () => {
      const item: NavigationItemType = {
        type: "link",
        to: "/api",
        label: "API Reference",
      };

      await render(<NavigationItem item={item} />);

      const link = screen.getByText("API Reference");
      expect(link).toBeInTheDocument();
    });

    it("renders external link with icon", async () => {
      const item: NavigationItemType = {
        type: "link",
        to: "https://example.com",
        label: "External Link",
        target: "_blank",
      };

      await render(<NavigationItem item={item} />);

      expect(screen.getByText("External Link")).toBeInTheDocument();
    });

    it("renders link with badge", async () => {
      const item: NavigationItemType = {
        type: "link",
        to: "/api",
        label: "API",
        badge: {
          label: "v2.0",
          color: "blue",
        },
      };

      await render(<NavigationItem item={item} />);

      expect(screen.getByText("API")).toBeInTheDocument();
      expect(screen.getByText("v2.0")).toBeInTheDocument();
    });
  });

  describe("custom-page type", () => {
    it("renders custom page link", async () => {
      const item: NavigationItemType = {
        type: "custom-page",
        path: "/custom",
        label: "Custom Page",
        element: <div>Custom</div>,
      };

      await render(<NavigationItem item={item} />);

      expect(screen.getByText("Custom Page")).toBeInTheDocument();
    });
  });

  describe("separator type", () => {
    it("renders separator", async () => {
      const item: NavigationItemType = {
        type: "separator",
        label: "sep-1",
        display: "always",
      };

      const { container } = await render(<NavigationItem item={item} />);

      // Separator renders as a horizontal line
      const separator = container.querySelector('[role="separator"]');
      expect(separator).toBeInTheDocument();
    });
  });

  describe("section type", () => {
    it("renders section header", async () => {
      const item: NavigationItemType = {
        type: "section",
        label: "Getting Started",
        display: "always",
      };

      await render(<NavigationItem item={item} />);

      expect(screen.getByText("Getting Started")).toBeInTheDocument();
    });
  });

  describe("filter type", () => {
    it("renders filter input", async () => {
      const item: NavigationItemType = {
        type: "filter",
        placeholder: "Search docs",
        label: "filter-1",
        display: "always",
      };

      await render(<NavigationItem item={item} />);

      const input = screen.getByPlaceholderText("Search docs");
      expect(input).toBeInTheDocument();
    });
  });

  describe("display logic", () => {
    it("hides item with display: hide", async () => {
      const item: NavigationItemType = {
        type: "doc",
        file: "test",
        label: "Hidden Document",
        path: "/test",
        display: "hide",
      };

      const { container } = await render(<NavigationItem item={item} />);

      expect(container.firstChild).toBeNull();
    });

    it("shows item with display: always", async () => {
      const item: NavigationItemType = {
        type: "doc",
        file: "test",
        label: "Visible Document",
        path: "/test",
        display: "always",
      };

      await render(<NavigationItem item={item} />);

      expect(screen.getByText("Visible Document")).toBeInTheDocument();
    });

    it("hides auth-only item when not authenticated", async () => {
      useAuthState.setState({ isAuthenticated: false });

      const item: NavigationItemType = {
        type: "doc",
        file: "test",
        label: "Admin Panel",
        path: "/admin",
        display: "auth",
      };

      const { container } = await render(<NavigationItem item={item} />);

      expect(container.firstChild).toBeNull();
    });

    it("shows auth-only item when authenticated", async () => {
      useAuthState.setState({
        isAuthenticated: true,
        profile: { email: "user@example.com" },
      });

      const item: NavigationItemType = {
        type: "doc",
        file: "test",
        label: "Admin Panel",
        path: "/admin",
        display: "auth",
      };

      await render(<NavigationItem item={item} />);

      expect(screen.getByText("Admin Panel")).toBeInTheDocument();

      // Reset auth state
      useAuthState.setState({ isAuthenticated: false, profile: null });
    });

    it("shows anon-only item when not authenticated", async () => {
      useAuthState.setState({ isAuthenticated: false });

      const item: NavigationItemType = {
        type: "doc",
        file: "test",
        label: "Sign In",
        path: "/signin",
        display: "anon",
      };

      await render(<NavigationItem item={item} />);

      expect(screen.getByText("Sign In")).toBeInTheDocument();
    });

    it("hides anon-only item when authenticated", async () => {
      useAuthState.setState({
        isAuthenticated: true,
        profile: { email: "user@example.com" },
      });

      const item: NavigationItemType = {
        type: "doc",
        file: "test",
        label: "Sign In",
        path: "/signin",
        display: "anon",
      };

      const { container } = await render(<NavigationItem item={item} />);

      expect(container.firstChild).toBeNull();

      // Reset auth state
      useAuthState.setState({ isAuthenticated: false, profile: null });
    });
  });

  describe("onRequestClose callback", () => {
    it("calls onRequestClose when clicked", async () => {
      let callbackCalled = false;
      const onRequestClose = () => {
        callbackCalled = true;
      };

      const item: NavigationItemType = {
        type: "doc",
        file: "test",
        label: "Test Document",
        path: "/test",
      };

      await render(<NavigationItem item={item} onRequestClose={onRequestClose} />);

      const link = screen.getByText("Test Document");
      await act(async () => {
        link.click();
      });

      expect(callbackCalled).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("handles item with very long label", async () => {
      const item: NavigationItemType = {
        type: "doc",
        file: "test",
        label: "This is a very long navigation label that should be truncated",
        path: "/test",
      };

      await render(<NavigationItem item={item} />);

      expect(
        screen.getByText(
          "This is a very long navigation label that should be truncated",
        ),
      ).toBeInTheDocument();
    });

    it("handles item without icon", async () => {
      const item: NavigationItemType = {
        type: "doc",
        file: "test",
        label: "No Icon Document",
        path: "/test",
      };

      await render(<NavigationItem item={item} />);

      expect(screen.getByText("No Icon Document")).toBeInTheDocument();
    });

    it("handles link with hash anchor", async () => {
      const item: NavigationItemType = {
        type: "link",
        to: "/docs#section",
        label: "Jump to Section",
      };

      await render(<NavigationItem item={item} />);

      expect(screen.getByText("Jump to Section")).toBeInTheDocument();
    });

    it("handles link with query parameters", async () => {
      const item: NavigationItemType = {
        type: "link",
        to: "/docs?search=test",
        label: "Search Results",
      };

      await render(<NavigationItem item={item} />);

      expect(screen.getByText("Search Results")).toBeInTheDocument();
    });
  });
});