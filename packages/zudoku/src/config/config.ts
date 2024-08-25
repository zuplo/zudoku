import { MarkdownPluginOptions } from "../lib/plugins/markdown/index.js";
import type { ZudokuConfig } from "./validators/validate.js";

export type URLString = `https://${string}` | `http://${string}`;

export { type ZudokuConfig };

export interface ZudokuPluginOptions extends ZudokuConfig {
  rootDir: string;
  moduleDir: string;

  // Internal use only
  mode: "internal" | "module" | "standalone";
}

export interface DocsConfig {
  files?: string;
  defaultOptions?: MarkdownPluginOptions["defaultOptions"];
}

export type ClerkAuthenticationConfig = {
  type: "clerk";
  clerkPubKey: `pk_test_${string}` | `pk_live_${string}`;
} & RedirectOptions;

export type OpenIDAuthenticationConfig = {
  type: "openid";
  clientId: string;

  issuer: string;
  scopes?: string[];
  audience?: string;
} & RedirectOptions;

export type Auth0AuthenticationConfig = {
  type: "auth0";
  clientId: string;
  domain: string;
  audience?: string;

  redirectToAfterSignUp?: string;
  redirectToAfterSignIn?: string;
  redirectToAfterSignOut?: string;
} & RedirectOptions;

type RedirectOptions = {
  redirectToAfterSignUp?: string;
  redirectToAfterSignIn?: string;
  redirectToAfterSignOut?: string;
};
