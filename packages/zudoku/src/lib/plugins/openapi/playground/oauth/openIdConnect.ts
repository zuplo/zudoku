import {
  type AuthorizationCodeResult,
  performAuthorizationCodeFlow,
} from "./authorizationCode.js";

type OpenIDConfiguration = {
  authorization_endpoint: string;
  token_endpoint: string;
  scopes_supported?: string[];
  response_types_supported?: string[];
};

/**
 * Discover OpenID Connect configuration and perform Authorization Code + PKCE flow.
 */
export const performOpenIdConnectFlow = async ({
  openIdConnectUrl,
  clientId,
  scopes,
  redirectUri,
  basePath,
}: {
  openIdConnectUrl: string;
  clientId: string;
  scopes?: string[];
  redirectUri?: string;
  basePath?: string;
}): Promise<AuthorizationCodeResult> => {
  const config = await fetchOpenIdConfiguration(openIdConnectUrl);

  return performAuthorizationCodeFlow({
    authorizationUrl: config.authorization_endpoint,
    tokenUrl: config.token_endpoint,
    clientId,
    scopes: scopes ?? ["openid"],
    redirectUri,
    basePath,
  });
};

export const fetchOpenIdConfiguration = async (
  url: string,
): Promise<OpenIDConfiguration> => {
  let response: Response;
  try {
    response = await fetch(url);
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error(
        `Failed to fetch OpenID configuration — this is likely a CORS issue. The discovery endpoint at ${url} must allow cross-origin requests.`,
      );
    }
    throw err;
  }
  if (!response.ok) {
    throw new Error(
      `Failed to fetch OpenID configuration (${response.status})`,
    );
  }
  return await response.json();
};
