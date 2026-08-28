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
import type { GetUserMetadata } from "./metadata.js";
import { useAuthState } from "./state.js";

const PROFILE = {
  sub: "user-1",
  email: "user@example.com",
  emailVerified: true,
  name: "Test",
  pictureUrl: undefined,
};

const renderMetadata = (getUserMetadata?: GetUserMetadata) => {
  const queryClient = new QueryClient({
    // The hook sets `retry: 1`; drop the backoff so the retry is immediate.
    defaultOptions: { queries: { retryDelay: 0 } },
  });
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
