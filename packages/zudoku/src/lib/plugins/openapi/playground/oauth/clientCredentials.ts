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

  let response: Response;
  try {
    response = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        `Token request to ${tokenUrl} failed. This is likely a CORS issue - the token endpoint must allow requests from ${window.location.origin}. Check the server's Access-Control-Allow-Origin header.`,
      );
    }
    throw error;
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token request failed (${response.status}): ${text}`);
  }

  return await response.json();
};
