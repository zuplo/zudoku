// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { ZudokuProvider } from "../components/context/ZudokuProvider.js";
import { ZudokuContext } from "../core/ZudokuContext.js";
import { useRefreshUserProfile, useVerifiedEmail } from "./hook.js";
import { type UserProfile, useAuthState } from "./state.js";

const PROFILE: UserProfile = {
  sub: "user-1",
  email: "user@example.com",
  emailVerified: true,
  name: "Test",
  pictureUrl: undefined,
};

const MINUTE = 60 * 1000;

const setup = (refreshResult = true) => {
  const refreshUserProfile = vi.fn().mockResolvedValue(refreshResult);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const context = new ZudokuContext({}, queryClient, {});
  // @ts-expect-error - setting readonly property for test
  context.authentication = { refreshUserProfile };

  const wrapper = ({ children }: PropsWithChildren) => (
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <ZudokuProvider context={context}>{children}</ZudokuProvider>
      </QueryClientProvider>
    </MemoryRouter>
  );

  return { refreshUserProfile, wrapper };
};

const flush = () => act(() => new Promise((r) => setTimeout(r, 0)));

describe("useRefreshUserProfile", () => {
  beforeEach(() => {
    useAuthState.getState().setLoggedOut();
  });

  afterEach(() => {
    localStorage.clear();
  });

  test("skips the refresh on mount when the persisted profile is fresh", async () => {
    useAuthState.setState({
      profile: PROFILE,
      profileFetchedAt: Date.now() - MINUTE,
    });
    const { refreshUserProfile, wrapper } = setup();

    renderHook(() => useRefreshUserProfile(), { wrapper });
    await flush();

    expect(refreshUserProfile).not.toHaveBeenCalled();
  });

  test("refreshes on mount when the persisted profile is stale", async () => {
    useAuthState.setState({
      profile: PROFILE,
      profileFetchedAt: Date.now() - 10 * MINUTE,
    });
    const { refreshUserProfile, wrapper } = setup();

    renderHook(() => useRefreshUserProfile(), { wrapper });
    await flush();

    expect(refreshUserProfile).toHaveBeenCalledTimes(1);
    expect(useAuthState.getState().profileFetchedAt).toBeGreaterThan(
      Date.now() - MINUTE,
    );
  });

  test("refreshes on mount when the persisted profile has no fetch time", async () => {
    useAuthState.setState({ profile: PROFILE, profileFetchedAt: null });
    const { refreshUserProfile, wrapper } = setup();

    renderHook(() => useRefreshUserProfile(), { wrapper });
    await flush();

    expect(refreshUserProfile).toHaveBeenCalledTimes(1);
  });

  test("refreshes on mount when there is no profile", async () => {
    const { refreshUserProfile, wrapper } = setup();

    renderHook(() => useRefreshUserProfile(), { wrapper });
    await flush();

    expect(refreshUserProfile).toHaveBeenCalledTimes(1);
  });

  test("doesn't timestamp a refresh that fetched nothing", async () => {
    const { wrapper } = setup(false);

    renderHook(() => useRefreshUserProfile(), { wrapper });
    await flush();

    expect(useAuthState.getState().profileFetchedAt).toBeNull();
  });

  test("shares one refresh between components that mount together", async () => {
    const { refreshUserProfile, wrapper } = setup();

    renderHook(
      () => {
        useRefreshUserProfile();
        useRefreshUserProfile();
        useRefreshUserProfile();
      },
      { wrapper },
    );
    await flush();

    expect(refreshUserProfile).toHaveBeenCalledTimes(1);
  });
});

describe("useVerifiedEmail", () => {
  beforeEach(() => {
    useAuthState.getState().setLoggedOut();
  });

  afterEach(() => {
    localStorage.clear();
  });

  test("refreshes on mount while the email is unverified, even when fresh", async () => {
    useAuthState.setState({
      profile: { ...PROFILE, emailVerified: false },
      profileFetchedAt: Date.now() - MINUTE,
    });
    const { refreshUserProfile, wrapper } = setup();

    renderHook(() => useVerifiedEmail(), { wrapper });
    await flush();

    expect(refreshUserProfile).toHaveBeenCalledTimes(1);
  });

  test("uses the cached profile once the email is verified", async () => {
    useAuthState.setState({
      profile: PROFILE,
      profileFetchedAt: Date.now() - MINUTE,
    });
    const { refreshUserProfile, wrapper } = setup();

    renderHook(() => useVerifiedEmail(), { wrapper });
    await flush();

    expect(refreshUserProfile).not.toHaveBeenCalled();
  });
});
