import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SecuritySchemeType = "apiKey" | "http" | "oauth2" | "openIdConnect";

export type SecuritySchemeSelection = {
  name: string; // The scheme name (e.g., "cookieAuth")
  type: SecuritySchemeType;
  value?: string; // The actual credential value
  scopes?: string[];
  // For apiKey type: where and what parameter name
  apiKey?: {
    in: "header" | "query" | "cookie";
    name: string; // The actual parameter/cookie name (e.g., "session_id")
  };
  // For http type: the scheme (e.g., "bearer", "basic")
  scheme?: string;
};

type SecurityState = {
  selectedSchemes: Record<string, SecuritySchemeSelection | null>; // operationId -> selected scheme
  credentials: Record<string, string>; // schemeName -> credential value
  setSelectedScheme: (
    operationId: string,
    scheme: SecuritySchemeSelection | null,
  ) => void;
  setCredential: (schemeName: string, value: string) => void;
  getSelectedScheme: (operationId: string) => SecuritySchemeSelection | null;
  getCredential: (schemeName: string) => string | undefined;
};

export const useSecurityState = create<SecurityState>()(
  persist(
    (set, get) => ({
      selectedSchemes: {},
      credentials: {},

      setSelectedScheme: (operationId, scheme) =>
        set((state) => ({
          selectedSchemes: {
            ...state.selectedSchemes,
            [operationId]: scheme,
          },
        })),

      setCredential: (schemeName, value) =>
        set((state) => ({
          credentials: {
            ...state.credentials,
            [schemeName]: value,
          },
        })),

      getSelectedScheme: (operationId) => {
        return get().selectedSchemes[operationId] ?? null;
      },

      getCredential: (schemeName) => {
        return get().credentials[schemeName];
      },
    }),
    {
      name: "zudoku-security-state",
      partialize: (state) => ({
        credentials: state.credentials,
        selectedSchemes: state.selectedSchemes,
      }),
    },
  ),
);
