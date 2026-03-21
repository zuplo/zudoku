export type ClientCredentialsResult = {
  access_token: string;
  token_type: string;
  expires_in?: number;
  scope?: string;
};

/**
 * Perform an OAuth2 Client Credentials flow.
 */
export const fetchClientCredentialsToken = async ({
  tokenUrl,
  clientId,
  clientSecret,
  scopes,
}: {
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  scopes?: string[];
}): Promise<ClientCredentialsResult> => {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  if (scopes && scopes.length > 0) {
    body.set("scope", scopes.join(" "));
  }

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token request failed (${response.status}): ${text}`);
  }

  return response.json();
};
