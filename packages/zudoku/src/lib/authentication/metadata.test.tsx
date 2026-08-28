/**
 * @vitest-environment happy-dom
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ZudokuProvider } from "../components/context/ZudokuProvider.js";
import { ZudokuContext } from "../core/ZudokuContext.js";
import { useUserMetadata } from "./hook.js";
import { type GetUserMetadata, withMetadataTimeout } from "./metadata.js";
import { useAuthState } from "./state.js";

const PROFILE = {
  sub: "user-1",
  email: "user@example.com",
  emailVerified: true,
  name: "Test",
  pictureUrl: undefined,
};

const createQueryClient = () =>
  new QueryClient({
    // The hook sets `retry: 1`; drop the backoff so the retry is immediate.
    defaultOptions: { queries: { retryDelay: 0 } },
  });

const renderMetadata = (
  getUserMetadata?: GetUserMetadata,
  queryClient = createQueryClient(),
) => {
  const context = new ZudokuContext(
    { plugins: [], getUserMetadata },
    queryClient,
    {},
  );

  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>
      <ZudokuProvider context={context}>{children}</ZudokuProvider>
    </QueryClientProvider>
  );

  return renderHook(() => useUserMetadata(), { wrapper });
};

const signIn = (sub = "user-1") => {
  useAuthState.setState({
    isAuthenticated: true,
    isPending: false,
    profile: { ...PROFILE, sub },
    providerData: null,
  });
};

describe("useUserMetadata", () => {
  beforeEach(() => {
    useAuthState.getState().setLoggedOut();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("writes the resolved metadata onto the profile", async () => {
    signIn();
    const getMetadata = vi.fn().mockResolvedValue({ plan: "pro" });

    renderMetadata(getMetadata);

    await waitFor(() => {
      expect(useAuthState.getState().profile?.metadata).toEqual({
        plan: "pro",
      });
    });
  });

  it("passes the profile and a signRequest that the provider signs", async () => {
    signIn();
    const getMetadata = vi.fn().mockResolvedValue({ plan: "pro" });

    renderMetadata(getMetadata);

    await waitFor(() => expect(getMetadata).toHaveBeenCalled());

    const args = getMetadata.mock.calls[0]?.[0];
    expect(args.profile.sub).toBe("user-1");
    expect(typeof args.signRequest).toBe("function");
    expect(args.signal).toBeInstanceOf(AbortSignal);
  });

  it("does not run when no getMetadata is configured", async () => {
    signIn();

    const { result } = renderMetadata(undefined);

    expect(result.current.isMetadataPending).toBe(false);
    expect(useAuthState.getState().profile?.metadata).toBeUndefined();
  });

  it("does not run while signed out", async () => {
    const getMetadata = vi.fn().mockResolvedValue({ plan: "pro" });

    const { result } = renderMetadata(getMetadata);

    expect(getMetadata).not.toHaveBeenCalled();
    expect(result.current.isMetadataPending).toBe(false);
  });

  it("reloads for a different user", async () => {
    signIn("user-1");
    const getMetadata = vi
      .fn()
      .mockImplementation(({ profile }) =>
        Promise.resolve({ plan: profile.sub === "user-1" ? "free" : "pro" }),
      );

    const { rerender } = renderMetadata(getMetadata);

    await waitFor(() => {
      expect(useAuthState.getState().profile?.metadata).toEqual({
        plan: "free",
      });
    });

    signIn("user-2");
    rerender();

    await waitFor(() => {
      expect(useAuthState.getState().profile?.metadata).toEqual({
        plan: "pro",
      });
    });
  });

  it("re-applies metadata after the profile is replaced by a refresh", async () => {
    signIn();
    const getMetadata = vi.fn().mockResolvedValue({ plan: "pro" });

    renderMetadata(getMetadata);

    await waitFor(() => {
      expect(useAuthState.getState().profile?.metadata).toEqual({
        plan: "pro",
      });
    });

    // `refreshUserProfile` replaces the whole profile object with a freshly
    // built one, which has no metadata on it.
    useAuthState.setState({ profile: { ...PROFILE } });

    await waitFor(() => {
      expect(useAuthState.getState().profile?.metadata).toEqual({
        plan: "pro",
      });
    });
    expect(getMetadata).toHaveBeenCalledTimes(1);
  });

  it("applies cached metadata without re-running the lookup", async () => {
    const queryClient = createQueryClient();
    const getMetadata = vi.fn().mockResolvedValue({ plan: "pro" });

    signIn();
    const first = renderMetadata(getMetadata, queryClient);
    await waitFor(() =>
      expect(useAuthState.getState().profile?.metadata).toBeDefined(),
    );
    first.unmount();

    // Sign out and back in as the same user: the query cache is still fresh,
    // so `queryFn` is skipped entirely on the next mount.
    useAuthState.getState().setLoggedOut();
    signIn();
    renderMetadata(getMetadata, queryClient);

    await waitFor(() => {
      expect(useAuthState.getState().profile?.metadata).toEqual({
        plan: "pro",
      });
    });
    expect(getMetadata).toHaveBeenCalledTimes(1);
  });

  it("does not apply a result to a different user's profile", async () => {
    signIn("user-1");
    let resolve: ((value: { plan: string }) => void) | undefined;
    const getMetadata = vi.fn(
      () =>
        new Promise<{ plan: string }>((r) => {
          resolve = r;
        }),
    );

    renderMetadata(getMetadata);

    await waitFor(() => expect(getMetadata).toHaveBeenCalled());

    // The first user's lookup lands after someone else has signed in.
    signIn("user-2");
    resolve?.({ plan: "pro" });

    await new Promise((r) => setTimeout(r, 10));
    expect(useAuthState.getState().profile?.sub).toBe("user-2");
    expect(useAuthState.getState().profile?.metadata).toBeUndefined();
  });

  it("logs and clears metadata when the lookup fails", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    useAuthState.setState({
      isAuthenticated: true,
      isPending: false,
      profile: { ...PROFILE, metadata: { plan: "pro" } },
      providerData: null,
    });

    const getMetadata = vi.fn().mockRejectedValue(new Error("gateway down"));

    const { result } = renderMetadata(getMetadata);

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(useAuthState.getState().profile?.metadata).toBeUndefined();
    expect(result.current.isMetadataPending).toBe(false);
    // Retried exactly once before giving up.
    expect(getMetadata).toHaveBeenCalledTimes(2);
    expect(error).toHaveBeenCalledWith(
      "[Zudoku] Failed to load user metadata:",
      expect.any(Error),
    );
  });

  it("is pending until the lookup resolves", async () => {
    signIn();
    let resolve: ((value: { plan: string }) => void) | undefined;
    const getMetadata = vi.fn(
      () =>
        new Promise<{ plan: string }>((r) => {
          resolve = r;
        }),
    );

    const { result } = renderMetadata(getMetadata);

    await waitFor(() => expect(result.current.isMetadataPending).toBe(true));

    resolve?.({ plan: "pro" });

    await waitFor(() => expect(result.current.isMetadataPending).toBe(false));
  });
});

describe("withMetadataTimeout", () => {
  const originalAny = AbortSignal.any;

  afterEach(() => {
    Object.defineProperty(AbortSignal, "any", {
      configurable: true,
      writable: true,
      value: originalAny,
    });
  });

  it("aborts when the caller's signal aborts", () => {
    const controller = new AbortController();
    const signal = withMetadataTimeout(controller.signal);

    controller.abort();

    expect(signal.aborted).toBe(true);
  });

  it("keeps the timeout when AbortSignal.any is unavailable", async () => {
    // `AbortSignal.timeout` shipped before `AbortSignal.any`; browsers in
    // between must still get the timeout rather than only the caller's signal.
    Object.defineProperty(AbortSignal, "any", {
      configurable: true,
      writable: true,
      value: undefined,
    });

    const controller = new AbortController();
    const signal = withMetadataTimeout(controller.signal, 5);

    expect(signal.aborted).toBe(false);

    await waitFor(() => expect(signal.aborted).toBe(true));
  });

  it("propagates an already-aborted caller signal", () => {
    Object.defineProperty(AbortSignal, "any", {
      configurable: true,
      writable: true,
      value: undefined,
    });

    expect(withMetadataTimeout(AbortSignal.abort()).aborted).toBe(true);
  });
});
