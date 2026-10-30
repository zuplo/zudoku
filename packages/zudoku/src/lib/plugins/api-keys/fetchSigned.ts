import type { ZudokuContext } from "../../core/ZudokuContext.js";
import { ZudokuError } from "../../util/invariant.js";

const isJwt = (token: string) => token.split(".").length === 3;

const isAuthFailure = (response: Response) =>
  response.status === 401 || response.status === 403;

/**
 * Signs and sends a request to Zuplo's API key service. The service identifies
 * the user from a JWT access token, so an opaque token (e.g. Auth0 without an
 * `audience`) rejected with 401/403 is reported as a configuration error
 * instead of a generic request failure.
 */
export const fetchSigned = async (context: ZudokuContext, request: Request) => {
  const signedRequest = await context.signRequest(request);
  const response = await fetch(signedRequest);

  const accessToken = signedRequest.headers
    .get("Authorization")
    ?.replace(/^Bearer /i, "");

  if (isAuthFailure(response) && accessToken && !isJwt(accessToken)) {
    throw new ZudokuError(
      "The access token issued by the authentication provider can't be used to manage API keys.",
      {
        title: "Configuration Error",
        developerHint:
          "Zuplo API key management requires a JWT access token, but the authentication provider issued an opaque token. If you use Auth0, set `audience` in your authentication configuration to the identifier of your Auth0 API.",
      },
    );
  }

  return response;
};
