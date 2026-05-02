/**
 * @vitest-environment happy-dom
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render as testRender,
  screen,
} from "@testing-library/react";
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

describe("MobileTopNavigation", () => {
  it("renders the theme switch by default in the mobile navigation drawer", async () => {
    await render({ site: { title: "Test Site" } });

    fireEvent.click(screen.getByLabelText("Open navigation menu"));

    expect(screen.getByLabelText("Switch to dark mode")).toBeInTheDocument();
  });

  it("does not render the theme switch in the mobile navigation drawer when disabled", async () => {
    await render({
      site: { title: "Test Site" },
      header: { showThemeSwitch: false },
    });

    fireEvent.click(screen.getByLabelText("Open navigation menu"));

    expect(
      screen.queryByLabelText("Switch to dark mode"),
    ).not.toBeInTheDocument();
  });
});
