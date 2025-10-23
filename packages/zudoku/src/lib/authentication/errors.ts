import type { OAuth2Error } from "oauth4webapi";
import { ZudokuError, type ZudokuErrorOptions } from "../util/invariant.js";

export class AuthorizationError extends Error {}

export class OAuthAuthorizationError extends ZudokuError {
  error: OAuth2Error;

  constructor(
    message: string,
    error: OAuth2Error,
    options?: ZudokuErrorOptions,
  ) {
    super(message, options);
    this.error = error;
  }
}

export type OAuthErrorType =
  // Authorization errors
  | "invalid_request"
  | "unauthorized_client"
  | "access_denied"
  | "unsupported_response_type"
  | "invalid_scope"
  | "server_error"
  | "temporarily_unavailable"
  // Token errors
  | "invalid_client"
  | "invalid_grant"
  | "unsupported_grant_type"
  // Custom errors
  | "invalid_state"
  | "missing_code_verifier"
  | "network_error"
  | "token_expired"
  | "configuration_error"
  | "unknown_error";
