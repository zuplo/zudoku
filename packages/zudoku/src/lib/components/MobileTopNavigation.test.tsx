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
  it("renders the theme switch by default in the mobile navigation drawer", async () => {
    const user = userEvent.setup();
    await render({ site: { title: "Test Site" } });

    await user.click(screen.getByLabelText("Open navigation menu"));

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

    expect(
      screen.queryByRole("button", { name: themeSwitchName }),
    ).not.toBeInTheDocument();
  });
});
