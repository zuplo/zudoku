import type {
  SecuritySchemeSelection,
  SecuritySchemeType,
} from "../state/securityState.js";

/**
 * Information about where and how to apply authentication
 */
export type AuthApplication = {
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  cookies?: Record<string, string>;
};

/**
 * Metadata about a security scheme for display purposes
 */
export type SecuritySchemeInfo = {
  type: SecuritySchemeType;
  displayName: string;
  requiresCredential: boolean;
  credentialLabel: string;
  credentialPlaceholder: string;
};

/**
 * Infer the security scheme type from the scheme name
 */
export const inferSchemeType = (name: string): SecuritySchemeType => {
  const lowerName = name.toLowerCase();

  if (lowerName.includes("bearer") || lowerName.includes("basic")) {
    return "http";
  }
  if (lowerName.includes("oauth")) {
    return "oauth2";
  }
  if (lowerName.includes("openid")) {
    return "openIdConnect";
  }
  if (lowerName.includes("cookie")) {
    return "apiKey"; // Cookies are a type of API key
  }

  return "apiKey";
};

/**
 * Get display information for a security scheme
 */
export const getSchemeInfo = (name: string): SecuritySchemeInfo => {
  const lowerName = name.toLowerCase();
  const type = inferSchemeType(name);

  // HTTP Bearer
  if (lowerName.includes("bearer")) {
    return {
      type,
      displayName: "Bearer",
      requiresCredential: true,
      credentialLabel: "Bearer Token",
      credentialPlaceholder: "Enter your bearer token",
    };
  }

  // HTTP Basic
  if (lowerName.includes("basic")) {
    return {
      type,
      displayName: "Basic",
      requiresCredential: true,
      credentialLabel: "Credentials (base64)",
      credentialPlaceholder: "username:password (base64 encoded)",
    };
  }

  // Cookie
  if (lowerName.includes("cookie")) {
    return {
      type,
      displayName: "Cookie",
      requiresCredential: true,
      credentialLabel: "Cookie Value",
      credentialPlaceholder: "Enter cookie value",
    };
  }

  // OAuth 2.0
  if (lowerName.includes("oauth")) {
    return {
      type,
      displayName: "OAuth 2.0",
      requiresCredential: true,
      credentialLabel: "Access Token",
      credentialPlaceholder: "Enter your access token",
    };
  }

  // OpenID Connect
  if (lowerName.includes("openid")) {
    return {
      type,
      displayName: "OpenID Connect",
      requiresCredential: true,
      credentialLabel: "ID Token",
      credentialPlaceholder: "Enter your ID token",
    };
  }

  // API Key (default)
  return {
    type,
    displayName: "API Key",
    requiresCredential: true,
    credentialLabel: "API Key",
    credentialPlaceholder: "Enter your API key",
  };
};

/**
 * Get appropriate placeholder value for each authentication type
 */
const getPlaceholderValue = (auth: SecuritySchemeSelection): string => {
  const lowerName = auth.name.toLowerCase();

  // HTTP Bearer
  if (auth.type === "http" && lowerName.includes("bearer")) {
    return "<YOUR_BEARER_TOKEN>";
  }

  // HTTP Basic
  if (auth.type === "http" && lowerName.includes("basic")) {
    return "<BASE64_ENCODED_CREDENTIALS>";
  }

  // OAuth 2.0
  if (auth.type === "oauth2") {
    return "<YOUR_ACCESS_TOKEN>";
  }

  // OpenID Connect
  if (auth.type === "openIdConnect") {
    return "<YOUR_ID_TOKEN>";
  }

  // API Key - Cookie
  if (
    auth.type === "apiKey" &&
    (lowerName.includes("cookie") || auth.apiKey?.in === "cookie")
  ) {
    return "<YOUR_COOKIE_VALUE>";
  }

  // API Key - Query
  if (
    auth.type === "apiKey" &&
    (lowerName.includes("query") ||
      lowerName.includes("param") ||
      auth.apiKey?.in === "query")
  ) {
    return "<YOUR_API_KEY>";
  }

  // API Key - Header (default)
  if (auth.type === "apiKey") {
    return "<YOUR_API_KEY>";
  }

  // Other HTTP schemes (Digest, HOBA, etc.)
  if (auth.type === "http") {
    return "<YOUR_CREDENTIALS>";
  }

  // Generic fallback
  return "<YOUR_TOKEN>";
};

/**
 * Add apiKey metadata to a security scheme selection based on the scheme name
 */
export const addApiKeyMetadata = (
  selection: SecuritySchemeSelection,
  schemeName: string,
): void => {
  if (selection.type === "apiKey") {
    selection.apiKey = getApiKeyLocation(schemeName);
  }
};

/**
 * Determine where the API key should be placed based on the scheme name
 */
const getApiKeyLocation = (
  name: string,
): { in: "header" | "query" | "cookie"; name: string } => {
  const lowerName = name.toLowerCase();

  // Cookie authentication - try to extract cookie name from scheme name
  if (lowerName.includes("cookie")) {
    // Try to extract actual cookie name from patterns like:
    // "cookieAuth" -> fallback to common cookie names
    // "sessionCookie" -> "session"
    // "cookie_session" -> "session"

    // Common cookie names
    const commonCookieNames = [
      "session_id",
      "sessionid",
      "session",
      "auth_token",
      "token",
    ];

    // Check if any common name is in the scheme name
    for (const cookieName of commonCookieNames) {
      if (lowerName.includes(cookieName.replace("_", ""))) {
        return { in: "cookie", name: cookieName };
      }
    }

    // Default cookie name
    return { in: "cookie", name: "session_id" };
  }

  // Query parameter
  if (lowerName.includes("query") || lowerName.includes("param")) {
    return { in: "query", name: "api_key" };
  }

  // Default to header
  return { in: "header", name: "X-API-Key" };
};

/**
 * Apply authentication to a request based on the selected security scheme
 * This generates the actual headers/params/cookies needed for the request
 */
export const applyAuth = (
  auth: SecuritySchemeSelection | null,
  actualValue?: string,
): AuthApplication | null => {
  if (!auth) return null;

  const value = actualValue ?? auth.value ?? getPlaceholderValue(auth);
  const lowerName = auth.name.toLowerCase();

  // HTTP Bearer
  if (auth.type === "http" && lowerName.includes("bearer")) {
    return {
      headers: {
        Authorization: `Bearer ${value}`,
      },
    };
  }

  // HTTP Basic
  if (auth.type === "http" && lowerName.includes("basic")) {
    return {
      headers: {
        Authorization: `Basic ${value}`,
      },
    };
  }

  // Other HTTP Authentication Schemes (Digest, HOBA, Mutual, etc.)
  if (auth.type === "http") {
    // Extract scheme from name if present, otherwise use the name itself
    const scheme = auth.name.split(/Auth|auth/)[0] || auth.name;
    return {
      headers: {
        Authorization: `${scheme} ${value}`,
      },
    };
  }

  // OAuth 2.0 / OpenID Connect (typically use Bearer tokens)
  if (auth.type === "oauth2" || auth.type === "openIdConnect") {
    return {
      headers: {
        Authorization: `Bearer ${value}`,
      },
    };
  }

  // API Key
  if (auth.type === "apiKey") {
    // Use explicit apiKey metadata if available, otherwise infer from name
    const location = auth.apiKey ?? getApiKeyLocation(auth.name);

    if (location.in === "header") {
      return {
        headers: {
          [location.name]: value,
        },
      };
    }

    if (location.in === "query") {
      return {
        queryParams: {
          [location.name]: value,
        },
      };
    }

    if (location.in === "cookie") {
      return {
        cookies: {
          [location.name]: value,
        },
      };
    }
  }

  // Fallback: use Authorization header
  return {
    headers: {
      Authorization: value,
    },
  };
};

/**
 * Generate an auth header for code snippets
 */
export const generateAuthHeader = (
  auth: SecuritySchemeSelection | null,
  actualValue?: string,
): { name: string; value: string } | undefined => {
  const application = applyAuth(auth, actualValue);

  if (!application) return undefined;

  // If we have headers, return the first one
  if (application.headers) {
    const entries = Object.entries(application.headers);
    const firstEntry = entries[0];

    if (!firstEntry) return undefined;

    const [name, value] = firstEntry;
    return { name, value };
  }

  // If we have cookies, convert to Cookie header
  if (application.cookies) {
    const cookieString = Object.entries(application.cookies)
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");

    return { name: "Cookie", value: cookieString };
  }

  // Query params don't go in headers, so return undefined
  return undefined;
};

/**
 * Apply authentication to a Request object (for playground)
 */
export const applyAuthToRequest = (
  request: Request,
  auth: SecuritySchemeSelection | null,
): void => {
  const application = applyAuth(auth);
  if (!application) return;

  // Apply headers
  if (application.headers) {
    for (const [name, value] of Object.entries(application.headers)) {
      request.headers.set(name, value);
    }
  }

  // Apply query params (need to modify URL)
  if (application.queryParams) {
    const url = new URL(request.url);
    for (const [name, value] of Object.entries(application.queryParams)) {
      url.searchParams.set(name, value);
    }
    // Note: Request URL is immutable, so caller needs to create new Request
  }

  // Apply cookies
  if (application.cookies) {
    const cookies = Object.entries(application.cookies)
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");

    const existingCookie = request.headers.get("Cookie");
    request.headers.set(
      "Cookie",
      existingCookie ? `${existingCookie}; ${cookies}` : cookies,
    );
  }
};
