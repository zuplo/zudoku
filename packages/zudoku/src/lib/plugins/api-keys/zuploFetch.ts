import type { ZudokuContext } from "../../core/ZudokuContext.js";
import invariant, { ZudokuError } from "../../util/invariant.js";
import { throwIfProblemJson } from "../../util/problemJson.js";

const isJwtShaped = (token: string) => token.split(".").length === 3;

const OPAQUE_TOKEN_HINT =
  "Your identity provider issued an opaque access token, but the API keys endpoint requires a JWT. " +
  "With Auth0 this happens when no `audience` is requested, leaving a token that is only valid for `/userinfo`. " +
  "Set `audience` to your Zuplo API identifier in the authentication config.";

const REJECTED_TOKEN_HINT =
  "The Zuplo API rejected the access token. Check that its audience matches your Zuplo deployment.";

/**
 * Signs and performs a request against the Zuplo API keys endpoint.
 *
 * The endpoint authenticates with the access token from the configured
 * identity provider and requires it to be a JWT. Providers may legitimately
 * issue opaque access tokens (Auth0 does when no `audience` is requested), so
 * the token shape is only inspected once the API has actually rejected the
 * request — it is a diagnostic for a real failure, never a precondition on
 * sign-in.
 */
export const zuploFetch = async (
  context: ZudokuContext,
  request: Request,
  failureMessage: string,
): Promise<Response> => {
  const signedRequest = await context.signRequest(request);
  const response = await fetch(signedRequest);

  if (response.status === 401 || response.status === 403) {
    const token = signedRequest.headers
      .get("Authorization")
      ?.replace(/^Bearer /i, "");

    throw new ZudokuError(failureMessage, {
      title: "The Zuplo API rejected your access token",
      developerHint:
        token && !isJwtShaped(token) ? OPAQUE_TOKEN_HINT : REJECTED_TOKEN_HINT,
    });
  }

  // Must run after the status check above: `throwIfProblemJson` throws a plain
  // Error carrying only the problem detail, discarding the status code.
  await throwIfProblemJson(response);
  invariant(response.ok, failureMessage);

  return response;
};
