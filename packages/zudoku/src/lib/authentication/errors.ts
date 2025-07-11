export class AuthorizationError extends Error {}

export type OAuthError = {
  readonly type: OAuthErrorType | ({} & string);
  readonly error_description?: string;
  readonly error_uri?: string;
  readonly algs?: string;
  readonly scope?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly [parameter: string]: any | undefined;
};

export class OAuthAuthorizationError extends AuthorizationError {
  constructor(
    message: string,
    public error: OAuthError,
    options?: ErrorOptions,
  ) {
    super(message, options);
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
