// @vitest-environment happy-dom
import { act, render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { Link } from "react-router";
import { describe, expect, it } from "vitest";
import type { NavigationPlugin, ZudokuPlugin } from "../../lib/core/plugins.js";
import { StaticZudoku } from "../../lib/testing/index.js";
import invariant from "../../lib/util/invariant.js";
import { createRedirectRoutes } from "./createRedirectRoutes.js";

describe("createRedirectRoutes", () => {
  it("returns empty array when no redirects", () => {
    expect(createRedirectRoutes(undefined)).toEqual([]);
  });

  it("creates route objects with normalized paths", () => {
    const routes = createRedirectRoutes([
      { from: "/old/", to: "/new" },
      { from: "no-slash", to: "/target" },
    ]);
    expect(routes).toHaveLength(2);
    expect(routes[0]).toHaveProperty("path", "/old");
    expect(routes[1]).toHaveProperty("path", "/no-slash");
  });

  it("route loaders return 301 redirects", () => {
    const routes = createRedirectRoutes([{ from: "/old", to: "/new" }]);
    // biome-ignore lint/suspicious/noExplicitAny: we need to type the loader as any to avoid type errors
    const loader = routes[0]?.loader as any;
    invariant(typeof loader === "function", "loader should be a function");
    const result = loader({
      request: new Request("http://localhost/old"),
    });
    expect(result).toBeInstanceOf(Response);
    expect(result.status).toBe(301);
    expect(result.headers.get("location")).toBe("/new");
  });
});

const testPage = (text: string): ZudokuPlugin & NavigationPlugin => ({
  getRoutes: () => [
    {
      path: "/docs/overview",
      element: <div data-testid="overview">{text}</div>,
      handle: { layout: "none" },
    },
    {
      path: "/docs/guide",
      element: (
        <div data-testid="guide">
          <Link to="/old-path">Old link</Link>
          <Link to="/docs/overview">Overview link</Link>
        </div>
      ),
      handle: { layout: "none" },
    },
  ],
});

describe("redirect routes integration", () => {
  it("redirects on initial navigation to a redirect path", async () => {
    await act(async () => {
      render(
        <StaticZudoku
          path="/old-path"
          redirects={[{ from: "/old-path", to: "/docs/overview" }]}
          plugins={[testPage("Overview Page")]}
        />,
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("overview")).toHaveTextContent("Overview Page");
    });
  });

  it("redirects with trailing slash in from path", async () => {
    await act(async () => {
      render(
        <StaticZudoku
          path="/old-path"
          redirects={[{ from: "/old-path/", to: "/docs/overview" }]}
          plugins={[testPage("Overview Page")]}
        />,
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("overview")).toHaveTextContent("Overview Page");
    });
  });

  it("renders target page without redirect when path does not match", async () => {
    await act(async () => {
      render(
        <StaticZudoku
          path="/docs/guide"
          redirects={[{ from: "/old-path", to: "/docs/overview" }]}
          plugins={[testPage("Guide Page")]}
        />,
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("guide")).toBeInTheDocument();
    });
  });

  it("handles multiple redirects", async () => {
    await act(async () => {
      render(
        <StaticZudoku
          path="/another-old"
          redirects={[
            { from: "/old-path", to: "/docs/overview" },
            { from: "/another-old", to: "/docs/guide" },
          ]}
          plugins={[testPage("Guide Page")]}
        />,
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("guide")).toBeInTheDocument();
    });
  });

  it("redirects on client-side navigation via link click", async () => {
    await act(async () => {
      render(
        <StaticZudoku
          path="/docs/guide"
          redirects={[{ from: "/old-path", to: "/docs/overview" }]}
          plugins={[testPage("Overview Page")]}
        />,
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("guide")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText("Old link"));

    await waitFor(() => {
      expect(screen.getByTestId("overview")).toHaveTextContent("Overview Page");
    });
  });
});
