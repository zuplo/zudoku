/**
 * @vitest-environment happy-dom
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render as testRender, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ZudokuPlugin } from "../core/plugins.js";
import { ZudokuContext } from "../core/ZudokuContext.js";
import { ZudokuProvider } from "./context/ZudokuProvider.js";
import { Search, SearchProvider } from "./Search.js";

const render = async (plugins: ZudokuPlugin[]) => {
  const queryClient = new QueryClient();
  const context = new ZudokuContext({ plugins }, queryClient, {});

  await act(async () => {
    testRender(
      <QueryClientProvider client={queryClient}>
        <ZudokuProvider context={context}>
          <SearchProvider>
            <Search />
          </SearchProvider>
        </ZudokuProvider>
      </QueryClientProvider>,
    );
  });
};

const searchPlugin = (preloadSearch?: () => void): ZudokuPlugin => ({
  renderSearch: () => null,
  ...(preloadSearch && { preloadSearch }),
});

describe("SearchProvider", () => {
  it("preloads the search UI once the page is idle", async () => {
    const preloadSearch = vi.fn();

    await render([searchPlugin(preloadSearch)]);

    // The idle callback polyfill defers to a timer, so let it drain.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    expect(preloadSearch).toHaveBeenCalled();
  });

  it("preloads on hover and focus of the search trigger", async () => {
    const user = userEvent.setup();
    const preloadSearch = vi.fn();

    await render([searchPlugin(preloadSearch)]);
    preloadSearch.mockClear();

    const trigger = screen.getByRole("button", { name: /search/i });

    await user.hover(trigger);
    expect(preloadSearch).toHaveBeenCalled();

    preloadSearch.mockClear();
    await act(async () => {
      trigger.focus();
    });
    expect(preloadSearch).toHaveBeenCalled();
  });

  it("renders a search plugin that does not implement preloadSearch", async () => {
    await render([searchPlugin()]);

    const trigger = screen.getByRole("button", { name: /search/i });
    const user = userEvent.setup();

    await user.hover(trigger);
    await user.click(trigger);

    expect(trigger).toBeInTheDocument();
  });
});
