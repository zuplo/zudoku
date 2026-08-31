/**
 * @vitest-environment happy-dom
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render as testRender, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { createMemoryRouter, Outlet, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";
import { ZudokuContext } from "../core/ZudokuContext.js";
import type { ZudokuContextOptions } from "../core/ZudokuContext.js";
import { ZudokuProvider } from "./context/ZudokuProvider.js";
import { MobileTopNavigation } from "./MobileTopNavigation.js";

const render = async (options: Partial<ZudokuContextOptions> = {}) => {
  const queryClient = new QueryClient();
  const context = new ZudokuContext(options, queryClient, {});

  const router = createMemoryRouter(
    [
      {
        element: (
          <QueryClientProvider client={queryClient}>
            <ZudokuProvider context={context}>
              <MobileTopNavigation />
              <Outlet />
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

const themeSwitchName = /^(Toggle theme|Switch to (dark|light) mode)$/;

describe("MobileTopNavigation", () => {
  it("renders an accessible trigger without mounting the drawer body", async () => {
    await render({ site: { title: "Test Site" } });

    const trigger = screen.getByRole("button", {
      name: "Open navigation menu",
    });

    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveAttribute("aria-controls");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders the theme switch by default in the mobile navigation drawer", async () => {
    const user = userEvent.setup();
    await render({ site: { title: "Test Site" } });

    await user.click(screen.getByLabelText("Open navigation menu"));
    await screen.findByRole("dialog", undefined, { timeout: 5_000 });

    expect(
      screen.getByRole("button", { name: themeSwitchName }),
    ).toBeInTheDocument();
  });

  it("does not render the theme switch in the mobile navigation drawer when disabled", async () => {
    const user = userEvent.setup();
    await render({
      site: { title: "Test Site" },
      header: { themeSwitcher: { enabled: false } },
    });

    await user.click(screen.getByLabelText("Open navigation menu"));
    await screen.findByRole("dialog", undefined, { timeout: 5_000 });

    expect(
      screen.queryByRole("button", { name: themeSwitchName }),
    ).not.toBeInTheDocument();
  });

  it("forwards target and rel for top-nav links that open in a new tab", async () => {
    const user = userEvent.setup();
    await render({
      site: { title: "Test Site" },
      navigation: [
        {
          type: "link",
          label: "Support",
          to: "https://example.com/support",
          target: "_blank",
        },
        {
          type: "link",
          label: "Docs",
          to: "/docs",
        },
      ],
    });

    await user.click(screen.getByLabelText("Open navigation menu"));
    await screen.findByRole("dialog", undefined, { timeout: 5_000 });

    const external = screen.getByRole("link", { name: "Support" });
    expect(external.getAttribute("href")).toBe("https://example.com/support");
    expect(external.getAttribute("target")).toBe("_blank");
    expect(external.getAttribute("rel")).toBe("noopener noreferrer");

    const internal = screen.getByRole("link", { name: "Docs" });
    expect(internal.getAttribute("href")).toBe("/docs");
    expect(internal.getAttribute("target")).toBeNull();
    expect(internal.getAttribute("rel")).toBeNull();
  });
});
