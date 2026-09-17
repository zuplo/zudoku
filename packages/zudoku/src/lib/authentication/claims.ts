import type { CustomClaimRecord, UserProfile } from "./state.js";

/**
 * Keys the IdP claim merge must never write.
 *
 * `metadata` belongs to `authentication.getMetadata`. Letting a claim land
 * there would make a signed value and a fetched value indistinguishable at
 * every call site, which is the whole reason the two live in separate places.
 */
const RESERVED_CLAIMS = new Set(["metadata"]);

/**
 * Registered/protocol claims describe the token, not the user. They carry no
 * profile value and would otherwise bloat the SSR profile cookie, which is
 * size-capped.
 */
const PROTOCOL_CLAIMS = new Set([
  "acr",
  "amr",
  "at_hash",
  "aud",
  "auth_time",
  "azp",
  "c_hash",
  "client_id",
  "exp",
  "iat",
  "iss",
  "jti",
  "nbf",
  "nonce",
  "scope",
  "sid",
]);

type CoreProfile = Pick<
  UserProfile,
  "sub" | "email" | "emailVerified" | "name" | "pictureUrl"
>;

/**
 * Merge claim sources into a profile. Later sources win over earlier ones, and
 * the core identity fields are always applied last so no claim can overwrite
 * the identity that authorization decisions are made against.
 */
export const buildProfileFromClaims = (
  sources: Array<CustomClaimRecord | undefined>,
  core: CoreProfile,
): UserProfile => {
  const claims = sources.reduce<CustomClaimRecord>(
    (acc, source) => ({ ...acc, ...source }),
    {},
  );

  const dropped = Object.keys(claims).filter((key) => RESERVED_CLAIMS.has(key));

  if (dropped.length > 0 && process.env.NODE_ENV === "development") {
    // biome-ignore lint/suspicious/noConsole: Intentional developer warning
    console.warn(
      `[Zudoku] Ignoring reserved claim(s) ${dropped.join(", ")} from the identity provider. ` +
        `\`profile.metadata\` is populated by \`authentication.getMetadata\` only.`,
    );
  }

  return {
    ...Object.fromEntries(
      Object.entries(claims).filter(
        ([key]) => !RESERVED_CLAIMS.has(key) && !PROTOCOL_CLAIMS.has(key),
      ),
    ),
    ...core,
  };
};
