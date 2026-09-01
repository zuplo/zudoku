import type { ZudokuContext } from "../core/ZudokuContext.js";
import type { UserMetadata } from "./index.js";
import type { UserProfile } from "./state.js";

/**
 * Upper bound for a single `getMetadata` call. An endpoint that accepts the
 * connection and never responds would otherwise leave metadata-gated routes
 * undecided until the browser's own (multi-minute) timeout.
 */
export const USER_METADATA_TIMEOUT_MS = 10_000;

export type GetUserMetadataContext = {
  /** The profile derived from the identity provider's claims. */
  profile: UserProfile;
  context: ZudokuContext;
  /**
   * Adds the current user's credentials to a request. Provider-agnostic —
   * prefer this over reaching for the raw access token.
   */
  signRequest: (request: Request) => Promise<Request>;
  /** Aborts on unmount, on user change, and after a 10s timeout. */
  signal: AbortSignal;
};

/**
 * Loads custom user data after sign-in. The returned value replaces
 * `profile.metadata` wholesale.
 *
 * Runs in the browser: never close over secrets.
 */
export type GetUserMetadata = (
  context: GetUserMetadataContext,
) => Promise<UserMetadata | undefined> | UserMetadata | undefined;

export const withMetadataTimeout = (
  signal?: AbortSignal,
  timeoutMs = USER_METADATA_TIMEOUT_MS,
): AbortSignal => {
  const timeout = AbortSignal.timeout(timeoutMs);
  if (!signal) return timeout;

  if (typeof AbortSignal.any === "function") {
    return AbortSignal.any([signal, timeout]);
  }

  // `AbortSignal.timeout` shipped before `AbortSignal.any`, so combine the two
  // by hand rather than dropping the timeout on browsers in between.
  const controller = new AbortController();
  for (const source of [signal, timeout]) {
    if (source.aborted) {
      controller.abort(source.reason);
      break;
    }
    source.addEventListener("abort", () => controller.abort(source.reason), {
      once: true,
    });
  }

  return controller.signal;
};
