/**
 * Public entry point for authentication types (`zudoku/auth`).
 *
 * `UserMetadata` is declared here — rather than re-exported from elsewhere —
 * so consumers can augment it:
 *
 * ```ts
 * declare module "zudoku/auth" {
 *   interface UserMetadata {
 *     subscription: { plan: "free" | "pro"; seatsUsed: number };
 *   }
 * }
 * ```
 */
import type { CustomClaim } from "./state.js";

/**
 * Shape of `profile.metadata`, populated by `authentication.getMetadata`.
 *
 * The index signature keeps it usable without augmentation. Augmented members
 * must be JSON-serializable: the value is persisted to localStorage in SSG
 * mode and would not survive rehydration otherwise.
 */
export interface UserMetadata {
  [key: string]: CustomClaim;
}

export type {
  AuthActionContext,
  AuthActionOptions,
  AuthenticationPlugin,
  AuthenticationProviderInitializer,
  VerifyAccessTokenResult,
} from "./authentication.js";
export type {
  CustomClaim,
  CustomClaimArray,
  CustomClaimRecord,
  UserProfile,
} from "./state.js";
