export class AuthorizationError extends Error {}

interface OAuthError {
  readonly error: string;
  readonly error_description?: string;
  readonly error_uri?: string;
  readonly algs?: string;
  readonly scope?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly [parameter: string]: any | undefined;
}

export class OAuthAuthorizationError extends AuthorizationError {
  constructor(
    message: string,
    public error: OAuthError,
    options?: ErrorOptions,
  ) {
    super(message, options);
  }
}
