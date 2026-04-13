import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { SecuritySchemeType } from "../graphql/graphql.js";

export type BasicCredentials = { username: string; password: string };

export type SecurityCredentialValue = string | BasicCredentials;

export type SecurityCredential = {
  value: SecurityCredentialValue;
  isAuthorized: boolean;
};

type SecurityCredentialsState = {
  credentials: Record<string, SecurityCredential>;
  setCredential: (schemeName: string, value: SecurityCredentialValue) => void;
  clearCredential: (schemeName: string) => void;
  clearAll: () => void;
};

export const useSecurityCredentialsStore = create<SecurityCredentialsState>()(
  persist(
    (set) => ({
      credentials: {},
      setCredential: (schemeName, value) =>
        set((state) => ({
          credentials: {
            ...state.credentials,
            [schemeName]: { value, isAuthorized: true },
          },
        })),
      clearCredential: (schemeName) =>
        set((state) => {
          const { [schemeName]: _, ...rest } = state.credentials;
          return { credentials: rest };
        }),
      clearAll: () => set({ credentials: {} }),
    }),
    {
      name: "zudoku-security-credentials",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);

type SecurityScheme = {
  name: string;
  type: SecuritySchemeType;
  in?: string | null;
  paramName?: string | null;
  scheme?: string | null;
};

type SecurityRequirement = {
  schemes: Array<{
    scopes: Array<string>;
    scheme: SecurityScheme;
  }>;
};

/**
 * Find the first security requirement where all schemes have authorized credentials.
 * Skips empty requirements (anonymous access markers).
 */
const findSatisfiedRequirement = (
  security: SecurityRequirement[] | null | undefined,
  credentials: Record<string, SecurityCredential>,
) =>
  security?.find(
    (req) =>
      req.schemes.length > 0 &&
      req.schemes.every((s) => credentials[s.scheme.name]?.isAuthorized),
  );

/**
 * Get the list of header names that will be auto-injected by security credentials.
 */
export const getSecurityLockedHeaders = (
  security: SecurityRequirement[] | null | undefined,
  credentials: Record<string, SecurityCredential>,
): string[] => {
  const satisfied = findSatisfiedRequirement(security, credentials);
  if (!satisfied) return [];

  const headers = new Set<string>();
  for (const { scheme } of satisfied.schemes) {
    switch (scheme.type) {
      case "apiKey":
        if (scheme.in === "header" && scheme.paramName) {
          headers.add(scheme.paramName);
        }
        break;
      case "http":
      case "oauth2":
      case "openIdConnect":
        headers.add("Authorization");
        break;
    }
  }
  return Array.from(headers);
};

/**
 * Get query parameters to inject from security credentials.
 * Returns entries to append to the URL before creating the Request.
 */
export const getSecurityQueryParams = (
  security: SecurityRequirement[] | null | undefined,
  credentials: Record<string, SecurityCredential>,
): Array<[string, string]> => {
  const satisfied = findSatisfiedRequirement(security, credentials);
  if (!satisfied) return [];

  return satisfied.schemes.flatMap(({ scheme }) => {
    const cred = credentials[scheme.name];
    if (
      !cred ||
      scheme.type !== "apiKey" ||
      scheme.in !== "query" ||
      !scheme.paramName
    )
      return [];
    return [[scheme.paramName, cred.value as string]];
  });
};

/**
 * Apply security credentials to a Request object's headers.
 * Finds the first security requirement where all schemes are authorized,
 * then injects the credentials. Query params and cookies are not handled
 * here — use getSecurityQueryParams for query params. Cookie-based apiKey
 * auth is not supported in the browser playground due to fetch restrictions.
 */
export const applySecurityCredentials = (
  request: Request,
  security: SecurityRequirement[] | null | undefined,
  credentials: Record<string, SecurityCredential>,
): void => {
  const satisfied = findSatisfiedRequirement(security, credentials);
  if (!satisfied) return;

  for (const { scheme } of satisfied.schemes) {
    const cred = credentials[scheme.name];
    if (!cred) continue;

    switch (scheme.type) {
      case "apiKey": {
        const value = cred.value as string;
        if (scheme.in === "header" && scheme.paramName) {
          request.headers.set(scheme.paramName, value);
        }
        // query params are handled via getSecurityQueryParams before Request creation
        // cookie-based apiKey is not supported in browser fetch
        break;
      }
      case "http": {
        const httpScheme = scheme.scheme?.toLowerCase();
        if (httpScheme === "basic") {
          const { username, password } = cred.value as BasicCredentials;
          const encoded = btoa(
            new Uint8Array(
              new TextEncoder().encode(`${username}:${password}`),
            ).reduce((s, b) => s + String.fromCharCode(b), ""),
          );
          request.headers.set("Authorization", `Basic ${encoded}`);
        } else if (httpScheme === "bearer") {
          request.headers.set(
            "Authorization",
            `Bearer ${cred.value as string}`,
          );
        }
        break;
      }
      case "oauth2":
      case "openIdConnect": {
        request.headers.set("Authorization", `Bearer ${cred.value as string}`);
        break;
      }
    }
  }
};
