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
import type { ZudokuContextOptions } from "../../core/ZudokuContext.js";
import { ZudokuContext } from "../../core/ZudokuContext.js";
import { SlotProvider } from "../context/SlotProvider.js";
import { ZudokuProvider } from "../context/ZudokuProvider.js";
import { Main } from "../Main.js";

const render = async (
  options: Partial<ZudokuContextOptions>,
  initialPath: string,
) => {
  const queryClient = new QueryClient();
  const context = new ZudokuContext(options, queryClient, {});

  const router = createMemoryRouter(
    [
      {
        element: (
          <QueryClientProvider client={queryClient}>
            <ZudokuProvider context={context}>
              <SlotProvider slots={{}}>
                <Main>
                  <Outlet />
                </Main>
              </SlotProvider>
            </ZudokuProvider>
          </QueryClientProvider>
        ),
        children: [{ path: "*", element: null }],
      },
    ],
    { initialEntries: [initialPath] },
  );

  await act(async () => {
    testRender(<RouterProvider router={router} />);
  });

  return router;
};

// The desktop sidebar comes first; the drawer copy is rendered after it.
const getLocationsToggle = () =>
  screen.getAllByRole("button", { name: /(Collapse|Expand) section/ })[0];

describe("Navigation", () => {
  it("does not share category open state between sections with the same category label", async () => {
    const router = await render(
      {
        navigation: [
          {
            type: "category",
            label: "API Reference",
            link: { type: "link", to: "/api" },
            items: [
              {
                type: "category",
                label: "Locations",
                collapsed: false,
                items: [
                  {
                    type: "custom-page",
                    label: "Search",
                    path: "/api/locations",
                    element: null,
                  },
                ],
              },
            ],
          },
          {
            type: "category",
            label: "Documentation",
            link: { type: "link", to: "/docs" },
            items: [
              {
                type: "category",
                label: "Locations",
                collapsible: false,
                items: [
                  {
                    type: "custom-page",
                    label: "Location Keys",
                    path: "/docs/location-keys",
                    element: null,
                  },
                ],
              },
            ],
          },
        ],
      },
      "/api/locations",
    );

    const toggle = getLocationsToggle();
    expect(toggle?.getAttribute("aria-expanded")).toBe("true");

    await act(async () => {
      if (toggle) fireEvent.click(toggle);
    });
    expect(getLocationsToggle()?.getAttribute("aria-expanded")).toBe("false");

    await act(async () => {
      await router.navigate("/docs/location-keys");
    });

    // `collapsible: false` renders no toggle, so the category must start open
    // instead of inheriting the collapsed state from the API Reference sidebar.
    expect(
      screen.queryAllByRole("link", { name: "Location Keys", hidden: true }),
    ).not.toHaveLength(0);
  });

  it("does not share category open state between linkless sections with the same label", async () => {
    const router = await render(
      {
        navigation: [
          {
            type: "category",
            label: "Reference",
            items: [
              {
                type: "category",
                label: "Locations",
                collapsed: false,
                items: [
                  {
                    type: "custom-page",
                    label: "Search",
                    path: "/api/locations",
                    element: null,
                  },
                ],
              },
            ],
          },
          {
            type: "category",
            label: "Reference",
            items: [
              {
                type: "category",
                label: "Locations",
                collapsible: false,
                items: [
                  {
                    type: "custom-page",
                    label: "Location Keys",
                    path: "/docs/location-keys",
                    element: null,
                  },
                ],
              },
            ],
          },
        ],
      },
      "/api/locations",
    );

    await act(async () => {
      const toggle = getLocationsToggle();
      if (toggle) fireEvent.click(toggle);
    });
    expect(getLocationsToggle()?.getAttribute("aria-expanded")).toBe("false");

    await act(async () => {
      await router.navigate("/docs/location-keys");
    });

    expect(
      screen.queryAllByRole("link", { name: "Location Keys", hidden: true }),
    ).not.toHaveLength(0);
  });

  it("keeps category open state when navigating within the same section", async () => {
    const router = await render(
      {
        navigation: [
          {
            type: "category",
            label: "API Reference",
            link: { type: "link", to: "/api" },
            items: [
              {
                type: "custom-page",
                label: "Overview",
                path: "/api/overview",
                element: null,
              },
              {
                type: "category",
                label: "Locations",
                collapsed: false,
                items: [
                  {
                    type: "custom-page",
                    label: "Search",
                    path: "/api/locations",
                    element: null,
                  },
                ],
              },
            ],
          },
        ],
      },
      "/api/overview",
    );

    await act(async () => {
      const toggle = getLocationsToggle();
      if (toggle) fireEvent.click(toggle);
    });
    expect(getLocationsToggle()?.getAttribute("aria-expanded")).toBe("false");

    await act(async () => {
      await router.navigate("/api/overview?tab=1");
    });

    expect(getLocationsToggle()?.getAttribute("aria-expanded")).toBe("false");
  });
});
