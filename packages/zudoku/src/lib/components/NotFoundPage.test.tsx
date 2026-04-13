/**
 * @vitest-environment happy-dom
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render as testRender, screen } from "@testing-library/react";
import { createMemoryRouter, Outlet, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";
import type { ZudokuContextOptions } from "../core/ZudokuContext.js";
import { ZudokuContext } from "../core/ZudokuContext.js";
import { ZudokuProvider } from "./context/ZudokuProvider.js";
import { NotFoundPage } from "./NotFoundPage.js";

const render = async (options: Partial<ZudokuContextOptions> = {}) => {
  const queryClient = new QueryClient();
  const context = new ZudokuContext(options, queryClient, {});

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
        children: [{ path: "*", element: <NotFoundPage /> }],
      },
    ],
    { initialEntries: ["/missing-page"] },
  );

  await act(async () => {
    testRender(<RouterProvider router={router} />);
  });
};

describe("NotFoundPage", () => {
  it("renders default 404 page when notFoundPage is not configured", async () => {
    await render();

    expect(screen.getByText("Page not found")).toBeDefined();
    expect(screen.getByText("404")).toBeDefined();
    expect(screen.getByText("Go back home")).toBeDefined();
  });

  it("renders custom notFoundPage when configured in site", async () => {
    await render({
      site: {
        notFoundPage: <div>Custom lost in space page</div>,
      },
    });

    expect(screen.getByText("Custom lost in space page")).toBeDefined();
    expect(screen.queryByText("Page not found")).toBeNull();
  });
});
