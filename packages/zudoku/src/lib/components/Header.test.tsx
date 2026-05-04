/**
 * @vitest-environment happy-dom
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render as testRender, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { createMemoryRouter, Outlet, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZudokuContext } from "../core/ZudokuContext.js";
import type { ZudokuContextOptions } from "../core/ZudokuContext.js";
import { SlotProvider } from "./context/SlotProvider.js";
import { ZudokuProvider } from "./context/ZudokuProvider.js";
import { Header } from "./Header.js";

vi.mock("react-router", async (importOriginal) => {
  const mod = await importOriginal<typeof import("react-router")>();
  const OriginalLink = mod.Link;
  const LinkSpy = vi.fn((props: ComponentProps<typeof OriginalLink>) => (
    <OriginalLink {...props} />
  ));
  return { ...mod, Link: LinkSpy };
});

const { Link } = await import("react-router");
const LinkMock = vi.mocked(Link);

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
                <Header />
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

const getLogoLinkProps = () => {
  const call = LinkMock.mock.calls.find(
    ([props]) => props.className === "shrink-0",
  );
  return call?.[0];
};

describe("Header", () => {
  beforeEach(() => {
    LinkMock.mockClear();
  });

  describe("logo link", () => {
    it("defaults reloadDocument to true", async () => {
      await render({ site: { title: "Test Site" } });

      const props = getLogoLinkProps();
      expect(props?.reloadDocument).toBe(true);
    });
  });

  describe("theme switch", () => {
    it("renders by default in the desktop header", async () => {
      await render({ site: { title: "Test Site" } });

      expect(screen.getByLabelText("Switch to dark mode")).toBeInTheDocument();
    });

    it("does not render in the desktop header when disabled", async () => {
      await render({
        site: { title: "Test Site" },
        header: { themeSwitcher: { enabled: false } },
      });

      expect(
        screen.queryByLabelText("Switch to dark mode"),
      ).not.toBeInTheDocument();
    });
  });
});
