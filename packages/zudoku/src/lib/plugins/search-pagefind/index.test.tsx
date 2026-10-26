// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import { Suspense } from "react";
import { expect, it, vi } from "vitest";
import { isSearchPlugin } from "../../core/plugins.js";
import { pagefindSearchPlugin } from "./index.js";

const mounts = vi.hoisted(() => ({ count: 0 }));
const loads = vi.hoisted(() => ({ count: 0 }));

vi.mock("./PagefindSearch.js", async () => {
  const { useEffect } = await import("react");
  loads.count++;

  return {
    PagefindSearch: ({ isOpen }: { isOpen: boolean }) => {
      useEffect(() => {
        mounts.count++;
      }, []);

      return <div data-testid="pagefind" data-open={isOpen} />;
    },
  };
});

it("does not import the search chunk until preloadSearch is called", async () => {
  const plugin = pagefindSearchPlugin({ type: "pagefind" });
  expect(isSearchPlugin(plugin)).toBe(true);
  if (!isSearchPlugin(plugin)) return;

  // Nothing has rendered or preloaded yet, so the chunk must be untouched.
  expect(loads.count).toBe(0);

  plugin.preloadSearch?.();
  await vi.waitFor(() => expect(loads.count).toBe(1));

  // Repeated preloads reuse the in-flight/settled import.
  plugin.preloadSearch?.();
  await vi.waitFor(() => expect(loads.count).toBe(1));
  expect(mounts.count).toBe(0);
});

it("loads Pagefind on first open and preserves it across close and reopen", async () => {
  mounts.count = 0;
  const plugin = pagefindSearchPlugin({ type: "pagefind" });
  expect(isSearchPlugin(plugin)).toBe(true);
  if (!isSearchPlugin(plugin)) return;

  const onOpen = vi.fn();
  const onClose = vi.fn();
  const renderSearch = (isOpen: boolean) => (
    <Suspense>{plugin.renderSearch({ isOpen, onOpen, onClose })}</Suspense>
  );
  const view = render(renderSearch(false));

  expect(screen.queryByTestId("pagefind")).toBeNull();

  view.rerender(renderSearch(true));
  expect(await screen.findByTestId("pagefind")).toHaveAttribute(
    "data-open",
    "true",
  );
  expect(mounts.count).toBe(1);

  view.rerender(renderSearch(false));
  expect(screen.getByTestId("pagefind")).toHaveAttribute("data-open", "false");

  view.rerender(renderSearch(true));
  expect(screen.getByTestId("pagefind")).toHaveAttribute("data-open", "true");
  expect(mounts.count).toBe(1);
});
