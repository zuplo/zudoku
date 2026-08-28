// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import { Suspense } from "react";
import { expect, it, vi } from "vitest";
import { isSearchPlugin } from "../../core/plugins.js";
import { pagefindSearchPlugin } from "./index.js";

const mounts = vi.hoisted(() => ({ count: 0 }));

vi.mock("./PagefindSearch.js", async () => {
  const { useEffect } = await import("react");

  return {
    PagefindSearch: ({ isOpen }: { isOpen: boolean }) => {
      useEffect(() => {
        mounts.count++;
      }, []);

      return <div data-testid="pagefind" data-open={isOpen} />;
    },
  };
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
