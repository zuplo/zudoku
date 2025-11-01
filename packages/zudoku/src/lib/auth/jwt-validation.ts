import type { Request } from "express";
import * as jose from "jose";
import type { ZudokuConfig } from "../../config/config.js";

export type JWTPayload = {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
  email_verified?: boolean;
  [key: string]: unknown;
};

export type AuthState = {
  isLoggedIn: boolean;
  profile?: {
    sub: string;
    name?: string;
    email?: string;
    emailVerified?: boolean;
    pictureUrl?: string;
    [key: string]: unknown;
  };
};

/**
 * Extract JWT token from Authorization header or cookies
 */
export function extractToken(
  req: Request,
  config: ZudokuConfig,
): string | null {
  // First, try Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  // Then try cookies based on auth provider
  if (!config.authentication) {
    return null;
  }

  switch (config.authentication.type) {
    case "clerk": {
      // Clerk uses __session cookie or __clerk_db_jwt for development
      // Try session token first, then development JWT
      return req.cookies?.__session || req.cookies?.__clerk_db_jwt[0] || null;
    }
    case "supabase": {
      // Supabase stores access token in cookies
      // Format: sb-<project-ref>-auth-token
      const cookies = req.cookies || {};
      const supabaseCookie = Object.keys(cookies).find((key) =>
        key.match(/^sb-.*-auth-token$/),
      );
      if (supabaseCookie) {
        try {
          // Supabase stores JSON with access_token property
          const parsed = JSON.parse(cookies[supabaseCookie]);
          return parsed.access_token || null;
        } catch {
          return cookies[supabaseCookie] || null;
        }
      }
      return null;
    }
    case "auth0": {
      // Auth0 SPA SDK uses appSession cookie
      // Auth0 SDK stores session data encoded
      return req.cookies?.appSession || null;
    }
    case "openid":
    case "azureb2c": {
      // Generic OIDC - try common cookie names
      return (
        req.cookies?.id_token ||
        req.cookies?.access_token ||
        req.cookies?.auth_token ||
        null
      );
    }
    default:
      return null;
  }
}

/**
 * Validate JWT token using provider-specific validation
 */
export async function validateToken(
  token: string,
  config: ZudokuConfig,
): Promise<AuthState | null> {
  if (!config.authentication) {
    return null;
  }

  try {
    switch (config.authentication.type) {
      case "clerk":
        return await validateClerkToken(token, config.authentication);
      case "supabase":
        return await validateSupabaseToken(token, config.authentication);
      case "auth0":
        return await validateAuth0Token(token, config.authentication);
      case "openid":
        return await validateOpenIDToken(token, config.authentication);
      case "azureb2c":
        return await validateAzureB2CToken(token, config.authentication);
      default:
        return null;
    }
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: Logging allowed for debugging
    console.error("Token validation error:", error);
    return null;
  }
}

/**
 * Validate Clerk token using @clerk/backend
 */
async function validateClerkToken(
  token: string,
  config: Extract<
    NonNullable<ZudokuConfig["authentication"]>,
    { type: "clerk" }
  >,
): Promise<AuthState | null> {
  try {
    // Import Clerk backend SDK dynamically (optional peer dependency)
    const clerkBackend = await import("@clerk/backend").catch((err) => {
      // biome-ignore lint/suspicious/noConsole: Logging allowed for debugging
      console.error(
        "[@clerk/backend] package not found. Please install it:\n" +
          "  npm install @clerk/backend\n" +
          "  or\n" +
          "  pnpm add @clerk/backend\n" +
          "This is required for server-side Clerk authentication validation.",
      );
      throw err;
    });

    const { verifyToken, createClerkClient } = clerkBackend;

    // Get secret key from environment (required for server-side validation)
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
      // biome-ignore lint/suspicious/noConsole: Logging allowed for debugging
      console.warn(
        "CLERK_SECRET_KEY not found in environment. Cannot validate Clerk tokens server-side.\n" +
          "Set the CLERK_SECRET_KEY environment variable to enable SSR authentication with Clerk.",
      );
      return null;
    }

    // Verify the token
    const payload = await verifyToken(token, {
      secretKey,
      jwtKey: config.clerkPubKey,
    });

    if (!payload.sub) {
      return null;
    }

    // Get full user data from Clerk API for complete profile
    const clerk = createClerkClient({ secretKey });
    const user = await clerk.users.getUser(payload.sub);

    return {
      isLoggedIn: true,
      profile: {
        sub: user.id,
        name: user.fullName || undefined,
        email: user.emailAddresses[0]?.emailAddress,
        emailVerified:
          user.emailAddresses[0]?.verification?.status === "verified",
        pictureUrl: user.imageUrl,
        ...user.publicMetadata,
      },
    };
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: Logging allowed for debugging
    console.error("Clerk token validation failed:", error);
    return null;
  }
}

/**
 * Validate Supabase token
 */
async function validateSupabaseToken(
  token: string,
  config: Extract<
    NonNullable<ZudokuConfig["authentication"]>,
    { type: "supabase" }
  >,
): Promise<AuthState | null> {
  try {
    // Import Supabase client dynamically (optional peer dependency)
    const supabaseJs = await import("@supabase/supabase-js").catch((err) => {
      // biome-ignore lint/suspicious/noConsole: Logging allowed for debugging
      console.error(
        "[@supabase/supabase-js] package not found. Please install it:\n" +
          "  npm install @supabase/supabase-js\n" +
          "  or\n" +
          "  pnpm add @supabase/supabase-js\n" +
          "This is required for server-side Supabase authentication validation.",
      );
      throw err;
    });

    const { createClient } = supabaseJs;

    const supabase = createClient(config.supabaseUrl, config.supabaseKey, {
      auth: {
        persistSession: false,
      },
    });

    // Get user from token
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return null;
    }

    return {
      isLoggedIn: true,
      profile: {
        sub: data.user.id,
        name:
          data.user.user_metadata?.name || data.user.user_metadata?.full_name,
        email: data.user.email,
        emailVerified: data.user.email_confirmed_at != null,
        pictureUrl: data.user.user_metadata?.avatar_url,
        ...data.user.user_metadata,
      },
    };
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: Logging allowed for debugging
    console.error("Supabase token validation failed:", error);
    return null;
  }
}

/**
 * Validate Auth0 token using JWKS
 */
async function validateAuth0Token(
  token: string,
  config: Extract<
    NonNullable<ZudokuConfig["authentication"]>,
    { type: "auth0" }
  >,
): Promise<AuthState | null> {
  const issuer = `https://${config.domain}`;
  return await validateJWTWithJWKS(
    token,
    issuer,
    config.clientId,
    config.audience,
  );
}

/**
 * Validate OpenID Connect token using JWKS
 */
async function validateOpenIDToken(
  token: string,
  config: Extract<
    NonNullable<ZudokuConfig["authentication"]>,
    { type: "openid" }
  >,
): Promise<AuthState | null> {
  return await validateJWTWithJWKS(
    token,
    config.issuer,
    config.clientId,
    config.audience,
  );
}

/**
 * Validate Azure B2C token using JWKS
 */
async function validateAzureB2CToken(
  token: string,
  config: Extract<
    NonNullable<ZudokuConfig["authentication"]>,
    { type: "azureb2c" }
  >,
): Promise<AuthState | null> {
  return await validateJWTWithJWKS(token, config.issuer, config.clientId);
}

/**
 * Generic JWT validation using JWKS endpoint
 */
async function validateJWTWithJWKS(
  token: string,
  issuer: string,
  clientId?: string,
  audience?: string,
): Promise<AuthState | null> {
  try {
    // Discover JWKS endpoint
    const wellKnown = await fetch(`${issuer}/.well-known/openid-configuration`);
    if (!wellKnown.ok) {
      throw new Error("Failed to fetch OIDC configuration");
    }

    const config = await wellKnown.json();
    const jwksUri = config.jwks_uri;

    if (!jwksUri) {
      throw new Error("JWKS URI not found in OIDC configuration");
    }

    // Create JWKS remote
    const JWKS = jose.createRemoteJWKSet(new URL(jwksUri));

    // Verify token
    const { payload } = await jose.jwtVerify(token, JWKS, {
      issuer,
      audience: audience || clientId,
    });

    if (!payload.sub) {
      return null;
    }

    return {
      isLoggedIn: true,
      profile: {
        sub: payload.sub,
        name: (payload.name as string) || undefined,
        email: (payload.email as string) || undefined,
        emailVerified: (payload.email_verified as boolean) || undefined,
        pictureUrl: (payload.picture as string) || undefined,
        ...payload,
      },
    };
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: Logging allowed for debugging
    console.error("JWT validation failed:", error);
    return null;
  }
}

/**
 * Get issuer URL from auth config (for legacy compatibility)
 */
export function getIssuerFromConfig(config: ZudokuConfig): string | undefined {
  if (!config.authentication) {
    return undefined;
  }

  switch (config.authentication.type) {
    case "auth0":
      return `https://${config.authentication.domain}`;
    case "openid":
      return config.authentication.issuer;
    case "azureb2c":
      return config.authentication.issuer;
    case "clerk":
    case "supabase":
      // These use provider-specific SDKs, not generic JWKS
      return undefined;
    default:
      return undefined;
  }
}
