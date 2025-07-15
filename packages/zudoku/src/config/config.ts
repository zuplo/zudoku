import type { Provider } from "@supabase/supabase-js";
import type { ConfigWithMeta } from "./loader.js";
import type { BuildConfig } from "./validators/BuildSchema.js";
import type { ZudokuConfig } from "./validators/validate.js";

export type { ZudokuConfig };

export type ZudokuBuildConfig = BuildConfig;
export type LoadedConfig = ConfigWithMeta;

type RedirectOptions = {
  redirectToAfterSignUp?: string;
  redirectToAfterSignIn?: string;
  redirectToAfterSignOut?: string;
};

export type ClerkAuthenticationConfig = {
  type: "clerk";
  clerkPubKey: `pk_test_${string}` | `pk_live_${string}`;
  jwtTemplateName?: string;
} & RedirectOptions;

export type OpenIDAuthenticationConfig = {
  type: "openid";
  clientId: string;

  issuer: string;
  scopes?: string[];
  audience?: string;
  basePath?: string;
} & RedirectOptions;

export type Auth0AuthenticationConfig = {
  type: "auth0";
  clientId: string;
  domain: string;
  audience?: string;
  scopes?: string[];
} & RedirectOptions;

export type SupabaseAuthenticationConfig = {
  type: "supabase";
  provider: Provider;
  supabaseUrl: string;
  supabaseKey: string;
  basePath?: string;
} & RedirectOptions;

export type AzureB2CAuthenticationConfig = {
  type: "azureb2c";
  clientId: string;
  tenantName: string;
  policyName: string;
  scopes?: string[];
  basePath?: string;
  redirectToAfterSignUp?: string;
  redirectToAfterSignIn?: string;
  redirectToAfterSignOut?: string;
} & RedirectOptions;
