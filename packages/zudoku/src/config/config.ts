import type { ConfigWithMeta } from "./loader.js";
import type { BuildConfig } from "./validators/BuildSchema.js";
import type {
  AuthenticationConfig,
  ZudokuConfig,
} from "./validators/validate.js";

export type ZudokuBuildConfig = BuildConfig;
export type LoadedConfig = ConfigWithMeta;
export type { ZudokuConfig };

export type ClerkAuthenticationConfig = Extract<
  AuthenticationConfig,
  { type: "clerk" }
>;
export type OpenIDAuthenticationConfig = Extract<
  AuthenticationConfig,
  { type: "openid" }
>;
export type Auth0AuthenticationConfig = Extract<
  AuthenticationConfig,
  { type: "auth0" }
>;
export type SupabaseAuthenticationConfig = Extract<
  AuthenticationConfig,
  { type: "supabase" }
>;
export type FirebaseAuthenticationConfig = Extract<
  AuthenticationConfig,
  { type: "firebase" }
>;
export type AzureB2CAuthenticationConfig = Extract<
  AuthenticationConfig,
  { type: "azureb2c" }
>;
