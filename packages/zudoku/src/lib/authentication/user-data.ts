import type { UserDataConfig } from "../../config/config.js";
import { ZudokuError, type ZudokuErrorOptions } from "../util/invariant.js";
import type { CustomClaim, CustomClaimRecord, UserProfile } from "./state.js";

export class UserDataError extends ZudokuError {
  constructor(message: string, options?: Pick<ZudokuErrorOptions, "cause">) {
    super(message, {
      title: "Custom user data",
      developerHint:
        "Check the `authentication.userData` settings in your Zudoku config.",
      ...options,
    });
  }
}

const toError = (error: unknown): Error =>
  error instanceof Error ? error : new Error(String(error));

/**
 * `sub` is the identity of the profile, so custom user data must never be able
 * to rewrite it. Everything else is fair game — overriding `name` or `email`
 * from your own user store is a legitimate use of this feature.
 */
const RESERVED_PROFILE_KEYS = new Set(["sub"]);

type ClaimSource = Record<string, unknown> | undefined;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Decodes a JWT payload without verifying it. Only ever used on tokens the
 * IdP just issued to us (client) or that the verifier already authenticated
 * upstream (server), so this reads claims rather than establishing trust.
 */
export const decodeTokenClaims = async (
  token: string | undefined,
): Promise<Record<string, unknown> | undefined> => {
  if (!token) return undefined;
  try {
    const { decodeJwt } = await import("jose");
    return decodeJwt(token);
  } catch {
    return undefined;
  }
};

/**
 * Lifts configured claims out of the token payloads into a flat record.
 * Sources are consulted in order, so the first one carrying the claim wins.
 */
export const selectClaims = (
  claims: NonNullable<UserDataConfig["claims"]>,
  sources: ClaimSource[],
): CustomClaimRecord =>
  Object.fromEntries(
    claims.flatMap((entry) => {
      const claim = typeof entry === "string" ? entry : entry.claim;
      const as = typeof entry === "string" ? undefined : entry.as;

      const source = sources.find((s) => s && claim in s);
      if (!source) return [];

      return [[as ?? claim, source[claim] as CustomClaim]];
    }),
  );

/**
 * Calls the configured endpoint with the user's access token and returns the
 * data to merge into the profile. Resolves to `undefined` when the request
 * fails and the endpoint isn't `required`.
 */
export const fetchUserData = async (
  endpoint: NonNullable<UserDataConfig["endpoint"]>,
  accessToken: string,
): Promise<CustomClaimRecord | undefined> => {
  const {
    url,
    method = "GET",
    headers,
    as,
    required = false,
  } = typeof endpoint === "string" ? { url: endpoint } : endpoint;

  try {
    const response = await fetch(url, {
      method,
      // Core headers go last so configured ones can't drop the bearer token.
      headers: {
        ...headers,
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new UserDataError(
        `Request to ${url} failed with status ${response.status}`,
      );
    }

    const data: unknown = await response.json();

    if (as) return { [as]: data as CustomClaim };

    if (!isRecord(data)) {
      throw new UserDataError(
        `Response from ${url} is not a JSON object. Set \`as\` to nest it under a profile key.`,
      );
    }

    return data as CustomClaimRecord;
  } catch (error) {
    if (required) {
      throw error instanceof UserDataError
        ? error
        : new UserDataError(`Request to ${url} failed`, {
            cause: toError(error),
          });
    }

    // biome-ignore lint/suspicious/noConsole: Surface user data failures
    console.error("Failed to load custom user data:", error);
    return undefined;
  }
};

/**
 * Applies the `authentication.userData` config to a freshly built profile.
 * Endpoint data is applied after claims so it wins on a key collision.
 */
export const applyUserData = async (
  profile: UserProfile,
  {
    userData,
    accessToken,
    claimSources = [],
  }: {
    userData: UserDataConfig | undefined;
    accessToken: string;
    claimSources?: ClaimSource[];
  },
): Promise<UserProfile> => {
  if (!userData) return profile;

  const fromClaims = userData.claims?.length
    ? selectClaims(userData.claims, claimSources)
    : undefined;

  const fromEndpoint = userData.endpoint
    ? await fetchUserData(userData.endpoint, accessToken)
    : undefined;

  if (!fromClaims && !fromEndpoint) return profile;

  const merged = Object.entries({ ...fromClaims, ...fromEndpoint }).filter(
    ([key]) => !RESERVED_PROFILE_KEYS.has(key),
  );

  return { ...profile, ...Object.fromEntries(merged) };
};
