/**
 * @vitest-environment happy-dom
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render as testRender, screen } from "@testing-library/react";
import { createMemoryRouter, Outlet, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";
import { ZudokuContext } from "../core/ZudokuContext.js";
import type { ZudokuContextOptions } from "../core/ZudokuContext.js";
import { SlotProvider } from "./context/SlotProvider.js";
import { ZudokuProvider } from "./context/ZudokuProvider.js";
import { TopNavigation } from "./TopNavigation.js";

const render = async (options: Partial<ZudokuContextOptions> = {}) => {
  const queryClient = new QueryClient();
  const context = new ZudokuContext(options, queryClient, {});

  const router = createMemoryRouter(
    [
      {
        element: (
          <QueryClientProvider client={queryClient}>
            <ZudokuProvider context={context}>
              <SlotProvider slots={{}}>
                <TopNavigation />
                <Outlet />
              </SlotProvider>
            </ZudokuProvider>
          </QueryClientProvider>
        ),
        children: [{ path: "*", element: null }],
      },
    ],
    { initialEntries: ["/"] },
  );

  await act(async () => {
    testRender(<RouterProvider router={router} />);
  });
};

describe("TopNavigation", () => {
  it("forwards target and rel for links that open in a new tab", async () => {
    await render({
      navigation: [
        {
          type: "link",
          label: "Support",
          to: "https://example.com/support",
          target: "_blank",
        },
      ],
    });

    // Top nav is `hidden` below the lg breakpoint
    const link = screen.getByRole("link", { name: "Support", hidden: true });
    expect(link.getAttribute("href")).toBe("https://example.com/support");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("does not set target or rel when target is omitted", async () => {
    await render({
      navigation: [
        {
          type: "link",
          label: "Docs",
          to: "/docs",
        },
      ],
    });

    const link = screen.getByRole("link", { name: "Docs", hidden: true });
    expect(link.getAttribute("href")).toBe("/docs");
    expect(link.getAttribute("target")).toBeNull();
    expect(link.getAttribute("rel")).toBeNull();
  });

  it("forwards target=_self without adding rel", async () => {
    await render({
      navigation: [
        {
          type: "link",
          label: "Portal",
          to: "https://example.com/portal",
          target: "_self",
        },
      ],
    });

    const link = screen.getByRole("link", { name: "Portal", hidden: true });
    expect(link.getAttribute("target")).toBe("_self");
    expect(link.getAttribute("rel")).toBeNull();
  });
});
