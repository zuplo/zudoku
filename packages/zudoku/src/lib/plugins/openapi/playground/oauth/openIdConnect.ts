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
}: {
  openIdConnectUrl: string;
  clientId: string;
  scopes?: string[];
  redirectUri?: string;
}): Promise<AuthorizationCodeResult> => {
  const config = await fetchOpenIdConfiguration(openIdConnectUrl);

  return performAuthorizationCodeFlow({
    authorizationUrl: config.authorization_endpoint,
    tokenUrl: config.token_endpoint,
    clientId,
    scopes: scopes ?? ["openid"],
    redirectUri,
  });
};

export const fetchOpenIdConfiguration = async (
  url: string,
): Promise<OpenIDConfiguration> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch OpenID configuration (${response.status})`,
    );
  }
  return response.json();
};
