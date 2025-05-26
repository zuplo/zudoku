import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { type PropsWithChildren } from "react";
import { type Location } from "react-router";
import { assertType, describe, expect, it, vi } from "vitest";
import { ZudokuProvider } from "../components/context/ZudokuProvider.js";
import { ZudokuContext, type ZudokuEvents } from "../core/ZudokuContext.js";
import { useEvent } from "./useEvent.js";

/**
 * @vitest-environment happy-dom
 */

const createTestContext = () => {
  const queryClient = new QueryClient();
  const context = new ZudokuContext({}, queryClient);
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>
      <ZudokuProvider context={context}>{children}</ZudokuProvider>
    </QueryClientProvider>
  );

  return { context, wrapper };
};

const locationData = {
  pathname: "/test",
  hash: "",
  search: "",
  key: "",
  state: {},
} satisfies Location;

describe("useEvent", () => {
  it("returns latest event data without callback", async () => {
    const { context, wrapper } = createTestContext();
    const { result } = renderHook(() => useEvent("location"), { wrapper });

    await act(() => Promise.resolve());
    await act(async () => {
      context.emitEvent("location", { to: locationData });
    });

    expect(result.current).toEqual([{ to: locationData }]);
  });

  it("transforms event data with callback", async () => {
    const { context, wrapper } = createTestContext();
    const { result } = renderHook(
      () => useEvent("location", ({ to }) => to.pathname),
      { wrapper },
    );

    await act(() => Promise.resolve());
    await act(async () => {
      context.emitEvent("location", { to: locationData });
    });

    await waitFor(() => expect(result.current).toEqual("/test"));
  });

  it("handles side effects without return value", async () => {
    const { context, wrapper } = createTestContext();
    const sideEffect = vi.fn();

    const { result } = renderHook(
      () =>
        useEvent("location", (event) => {
          sideEffect(event);
        }),
      { wrapper },
    );

    await act(() => Promise.resolve());
    await act(async () => {
      context.emitEvent("location", { to: locationData });
    });

    expect(result.current).toBeUndefined();
    expect(sideEffect).toHaveBeenCalledWith({ to: locationData });
    expect(sideEffect).toHaveBeenCalledTimes(1);
  });

  it("removes event listener on cleanup", async () => {
    const { context, wrapper } = createTestContext();
    const sideEffect = vi.fn();

    const { unmount } = renderHook(
      () =>
        useEvent("location", (event) => {
          sideEffect(event);
        }),
      { wrapper },
    );

    await act(() => Promise.resolve());

    // First event emission
    await act(async () => {
      context.emitEvent("location", { to: locationData });
    });
    expect(sideEffect).toHaveBeenCalledTimes(1);

    // Unmount the hook
    unmount();

    // Second event emission after unmount
    await act(async () => {
      context.emitEvent("location", { to: locationData });
    });

    // The callback should not have been called again
    expect(sideEffect).toHaveBeenCalledTimes(1);
  });

  describe("types", () => {
    const { wrapper } = createTestContext();

    it("infers event type when no callback is provided", () => {
      const hook = renderHook(() => useEvent("location"), { wrapper });
      assertType<Parameters<ZudokuEvents["location"]> | undefined>(
        hook.result.current,
      );
    });

    it("infers string type from pathname callback", () => {
      const hook = renderHook(
        () => useEvent("location", ({ to }) => to.pathname),
        { wrapper },
      );
      assertType<string>(hook.result.current);
    });

    it("infers object type from object callback", () => {
      const hook = renderHook(
        () => useEvent("location", ({ to }) => ({ query: to.search })),
        { wrapper },
      );
      assertType<{ query: string }>(hook.result.current);
    });

    it("infers void type from empty callback", () => {
      const hook = renderHook(() => useEvent("location", () => {}), {
        wrapper,
      });
      assertType<void>(hook.result.current);
    });
  });
});
