import type {
  Auth0AuthenticationConfig,
  WorkOSAuthenticationConfig,
} from "../config.js";

export function auth0Validator(_config: Auth0AuthenticationConfig): void {}

export function workosValidator(_config: WorkOSAuthenticationConfig): void {}
