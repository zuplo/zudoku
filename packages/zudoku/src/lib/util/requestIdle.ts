/**
 * `requestIdleCallback` that is safe to call from `lib` code. `polyfills.ts`
 * only runs in the app entry, so components reachable from the public exports
 * (or from a test environment) cannot rely on the global existing.
 *
 * Returns a cancel function rather than an id so callers do not need to know
 * which of the two implementations ran.
 */
export const requestIdle = (callback: () => void, timeout = 10_000) => {
  if (typeof window === "undefined") return () => {};

  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(() => callback(), { timeout });
    return () => window.cancelIdleCallback(id);
  }

  const id = window.setTimeout(callback, 1);
  return () => window.clearTimeout(id);
};
