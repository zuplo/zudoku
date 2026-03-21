import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { SecuritySchemeType } from "../graphql/graphql.js";

export type BasicCredentials = { username: string; password: string };

export type SecurityCredentialValue = string | BasicCredentials;

export type SecurityCredential = {
  value: SecurityCredentialValue;
  isAuthorized: boolean;
  expiresAt?: number;
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
 * Get the list of header names that will be auto-injected by security credentials.
 */
export const getSecurityLockedHeaders = (
  security: SecurityRequirement[] | null | undefined,
  credentials: Record<string, SecurityCredential>,
): string[] => {
  if (!security) return [];

  const satisfied = security.find((req) =>
    req.schemes.every((s) => credentials[s.scheme.name]?.isAuthorized),
  );

  if (!satisfied) return [];

  const headers: string[] = [];
  for (const { scheme } of satisfied.schemes) {
    switch (scheme.type) {
      case "apiKey":
        if (scheme.in === "header" && scheme.paramName) {
          headers.push(scheme.paramName);
        }
        break;
      case "http":
      case "oauth2":
      case "openIdConnect":
        headers.push("Authorization");
        break;
    }
  }
  return headers;
};

/**
 * Apply security credentials to a Request object.
 * Finds the first security requirement where all schemes are authorized,
 * then injects the credentials.
 */
export const applySecurityCredentials = (
  request: Request,
  security: SecurityRequirement[] | null | undefined,
  credentials: Record<string, SecurityCredential>,
): void => {
  if (!security) return;

  const satisfied = security.find((req) =>
    req.schemes.every((s) => credentials[s.scheme.name]?.isAuthorized),
  );

  if (!satisfied) return;

  for (const { scheme } of satisfied.schemes) {
    const cred = credentials[scheme.name];
    if (!cred) continue;

    switch (scheme.type) {
      case "apiKey": {
        const value = cred.value as string;
        if (scheme.in === "header" && scheme.paramName) {
          request.headers.set(scheme.paramName, value);
        } else if (scheme.in === "query" && scheme.paramName) {
          const url = new URL(request.url);
          url.searchParams.set(scheme.paramName, value);
          Object.defineProperty(request, "url", {
            value: url.toString(),
            writable: true,
          });
        } else if (scheme.in === "cookie" && scheme.paramName) {
          const existing = request.headers.get("Cookie") ?? "";
          const cookie = `${scheme.paramName}=${value}`;
          request.headers.set(
            "Cookie",
            existing ? `${existing}; ${cookie}` : cookie,
          );
        }
        break;
      }
      case "http": {
        if (scheme.scheme === "basic") {
          const { username, password } = cred.value as BasicCredentials;
          request.headers.set(
            "Authorization",
            `Basic ${btoa(`${username}:${password}`)}`,
          );
        } else if (scheme.scheme === "bearer") {
          request.headers.set(
            "Authorization",
            `Bearer ${cred.value as string}`,
          );
        } else {
          request.headers.set("Authorization", cred.value as string);
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
