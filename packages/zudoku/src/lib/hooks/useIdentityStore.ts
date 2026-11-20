import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const NO_IDENTITY = "__none";
export const SECURITY_SCHEME_PREFIX = "__security:";

export type IdentitySelection =
  | { type: "none" }
  | { type: "identity"; id: string }
  | { type: "scheme"; names: string[] };

// OpenAPI component keys are limited to `[a-zA-Z0-9.\-_]`, so `+` can't clash.
const SCHEME_NAME_SEPARATOR = "+";

export const schemeSetKey = (names: string[]) =>
  [...names].sort().join(SCHEME_NAME_SEPARATOR);

export const securitySchemeNamesLabel = (names: string[]) => names.join(" + ");

// The stored string encoding is private to Zudoku; public consumers work with
// `IdentitySelection` or the hooks in `useApiIdentitySelection.ts`.
export const identitySelectionToValue = (
  selection: IdentitySelection,
): string => {
  switch (selection.type) {
    case "none":
      return NO_IDENTITY;
    case "identity":
      return selection.id;
    case "scheme":
      return `${SECURITY_SCHEME_PREFIX}${schemeSetKey(selection.names)}`;
  }
};

export const valueToIdentitySelection = (
  value: string | null | undefined,
): IdentitySelection => {
  if (!value || value === NO_IDENTITY) {
    return { type: "none" };
  }
  if (!value.startsWith(SECURITY_SCHEME_PREFIX)) {
    return { type: "identity", id: value };
  }
  return {
    type: "scheme",
    names: value
      .slice(SECURITY_SCHEME_PREFIX.length)
      .split(SCHEME_NAME_SEPARATOR),
  };
};

interface IdentityState {
  rememberedIdentity: string | null;
  setRememberedIdentity: (identity: string | null) => void;
  getRememberedIdentity: (availableIdentities: string[]) => string | undefined;
}

// Holds the auth selection shared across all playgrounds (OpenAPI & GraphQL).
export const useIdentityStore = create<IdentityState>()(
  persist(
    (set, get) => ({
      rememberedIdentity: null,
      setRememberedIdentity: (identity: string | null) =>
        set({ rememberedIdentity: identity }),
      getRememberedIdentity: (availableIdentities: string[]) =>
        availableIdentities.find(
          (identity) => identity === get().rememberedIdentity,
        ),
    }),
    {
      name: "identity-storage",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
