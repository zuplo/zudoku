/**
 * @vitest-environment happy-dom
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  render as testRender,
  screen,
  within,
} from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { createMemoryRouter, Outlet, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";
import { ZudokuContext } from "../core/ZudokuContext.js";
import { SlotProvider } from "./context/SlotProvider.js";
import { ZudokuProvider } from "./context/ZudokuProvider.js";
import { Main } from "./Main.js";

const render = async () => {
  const queryClient = new QueryClient();
  const context = new ZudokuContext(
    {
      navigation: [
        {
          type: "category",
          label: "Guides",
          link: { type: "link", to: "/docs", label: "Guides" },
          items: [{ type: "link", label: "Introduction", to: "/docs" }],
        },
      ],
    },
    queryClient,
    {},
  );

  const router = createMemoryRouter(
    [
      {
        element: (
          <QueryClientProvider client={queryClient}>
            <ZudokuProvider context={context}>
              <SlotProvider slots={{}}>
                <Main>Content</Main>
                <Outlet />
              </SlotProvider>
            </ZudokuProvider>
          </QueryClientProvider>
        ),
        children: [{ path: "*", element: null }],
      },
    ],
    { initialEntries: ["/docs"] },
  );

  await act(async () => {
    testRender(<RouterProvider router={router} />);
  });
};

describe("Main mobile navigation", () => {
  it("renders an accessible trigger without mounting the drawer body", async () => {
    await render();

    const trigger = screen.getByRole("button", { name: "Menu" });

    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveAttribute("aria-controls");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("loads and opens the navigation drawer on demand", async () => {
    const user = userEvent.setup();
    await render();

    const trigger = screen.getByRole("button", { name: "Menu" });
    await user.click(trigger);

    const dialog = await screen.findByRole("dialog", undefined, {
      timeout: 5_000,
    });
    expect(
      within(dialog).getByRole("link", { name: "Introduction" }),
    ).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("restores focus to the trigger when the drawer closes", async () => {
    const user = userEvent.setup();
    await render();

    const trigger = screen.getByRole("button", { name: "Menu" });
    await user.click(trigger);
    await screen.findByRole("dialog", undefined, { timeout: 5_000 });
    await user.keyboard("{Escape}");

    expect(trigger).toHaveFocus();
  });
});
