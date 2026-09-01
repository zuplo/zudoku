/**
 * @vitest-environment happy-dom
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render as testRender, screen } from "@testing-library/react";
import { createHead, UnheadProvider } from "@unhead/react/client";
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
  const LinkMock = vi.fn((props: ComponentProps<typeof OriginalLink>) => (
    <OriginalLink {...props} />
  ));
  return { ...mod, Link: LinkMock };
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
          <UnheadProvider head={createHead()}>
            <QueryClientProvider client={queryClient}>
              <ZudokuProvider context={context}>
                <SlotProvider slots={{}}>
                  <Header />
                  <Outlet />
                </SlotProvider>
              </ZudokuProvider>
            </QueryClientProvider>
          </UnheadProvider>
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

const themeSwitchName = /^(Toggle theme|Switch to (dark|light) mode)$/;

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

    it("renders intrinsic dimensions for configured logos", async () => {
      await render({
        site: {
          title: "Test Site",
          logo: {
            src: { light: "/logo-light.svg", dark: "/logo-dark.svg" },
            width: 120,
            height: 32,
          },
        },
      });

      const logos = screen.getAllByRole("img", { name: "Test Site" });
      expect(logos).toHaveLength(2);
      for (const logo of logos) {
        expect(logo).toHaveAttribute("width", "120");
        expect(logo).toHaveAttribute("height", "32");
      }
    });
  });

  describe("theme switch", () => {
    it("renders by default in the desktop header", async () => {
      await render({ site: { title: "Test Site" } });

      expect(
        screen.getByRole("button", { name: themeSwitchName }),
      ).toBeInTheDocument();
    });

    it("does not render in the desktop header when disabled", async () => {
      await render({
        site: { title: "Test Site" },
        header: { themeSwitcher: { enabled: false } },
      });

      expect(
        screen.queryByRole("button", { name: themeSwitchName }),
      ).not.toBeInTheDocument();
    });
  });

  describe("search", () => {
    const searchPlugin = () => ({
      renderSearch: ({ isOpen }: { isOpen: boolean }) =>
        isOpen ? <div data-testid="search-modal" /> : null,
    });

    const pressSearchHotkey = async () => {
      await act(async () => {
        document.body.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "k",
            metaKey: true,
            bubbles: true,
            cancelable: true,
          }),
        );
      });
    };

    // `start` and `end` additionally render the responsive copy of the search
    // button, so the modal must not be tied to an individual button
    it.each(["start", "center", "end"] as const)(
      "opens a single modal for the %s placement",
      async (search) => {
        await render({
          site: { title: "Test Site" },
          header: { placements: { search } },
          plugins: [searchPlugin()],
        });

        expect(screen.queryAllByTestId("search-modal")).toHaveLength(0);

        await pressSearchHotkey();

        expect(screen.getAllByTestId("search-modal")).toHaveLength(1);
      },
    );

    it("opens the modal from every search button", async () => {
      await render({
        site: { title: "Test Site" },
        header: { placements: { search: "start" } },
        plugins: [searchPlugin()],
      });

      const buttons = screen.getAllByRole("button", { name: /search/i });
      expect(buttons.length).toBeGreaterThan(1);

      for (const button of buttons) {
        await act(async () => button.click());

        expect(screen.getAllByTestId("search-modal")).toHaveLength(1);
      }
    });

    it("renders no search button without a search plugin", async () => {
      await render({ site: { title: "Test Site" } });

      expect(
        screen.queryByRole("button", { name: /search/i }),
      ).not.toBeInTheDocument();
    });
  });
});
