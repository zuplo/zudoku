import { generateCodeChallenge, generateCodeVerifier } from "./pkce.js";

export type AuthorizationCodeResult = {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
};

/**
 * Initiate an OAuth2 Authorization Code flow with PKCE using a popup window.
 * Returns the access token after the full flow completes.
 */
export const performAuthorizationCodeFlow = async ({
  authorizationUrl,
  tokenUrl,
  clientId,
  scopes,
  redirectUri,
}: {
  authorizationUrl: string;
  tokenUrl: string;
  clientId: string;
  scopes?: string[];
  redirectUri?: string;
}): Promise<AuthorizationCodeResult> => {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateCodeVerifier(); // reuse PKCE util for random string

  const effectiveRedirectUri =
    redirectUri ?? `${window.location.origin}/oauth/callback`;

  const authUrl = new URL(authorizationUrl);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", effectiveRedirectUri);
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");
  authUrl.searchParams.set("state", state);
  if (scopes && scopes.length > 0) {
    authUrl.searchParams.set("scope", scopes.join(" "));
  }

  // Open popup and wait for redirect
  const code = await openAuthPopup(authUrl.toString(), state);

  // Exchange code for token
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: effectiveRedirectUri,
    client_id: clientId,
    code_verifier: codeVerifier,
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token exchange failed (${response.status}): ${text}`);
  }

  return response.json();
};

const openAuthPopup = (url: string, expectedState: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.innerWidth - width) / 2;
    const top = window.screenY + (window.innerHeight - height) / 2;

    const popup = window.open(
      url,
      "oauth-popup",
      `width=${width},height=${height},left=${left},top=${top},popup=true`,
    );

    if (!popup) {
      reject(new Error("Popup blocked. Please allow popups for this site."));
      return;
    }

    const interval = setInterval(() => {
      try {
        if (popup.closed) {
          clearInterval(interval);
          reject(new Error("Authorization cancelled by user."));
          return;
        }

        const popupUrl = new URL(popup.location.href);
        const code = popupUrl.searchParams.get("code");
        const state = popupUrl.searchParams.get("state");
        const error = popupUrl.searchParams.get("error");

        if (error) {
          clearInterval(interval);
          popup.close();
          const errorDesc = popupUrl.searchParams.get("error_description");
          reject(new Error(errorDesc ?? error));
          return;
        }

        if (code) {
          clearInterval(interval);
          popup.close();

          if (state !== expectedState) {
            reject(new Error("State mismatch. Possible CSRF attack."));
            return;
          }

          resolve(code);
        }
      } catch {
        // Cross-origin access — popup hasn't redirected back yet
      }
    }, 200);

    // Timeout after 5 minutes
    setTimeout(
      () => {
        clearInterval(interval);
        if (!popup.closed) popup.close();
        reject(new Error("Authorization timed out."));
      },
      5 * 60 * 1000,
    );
  });
