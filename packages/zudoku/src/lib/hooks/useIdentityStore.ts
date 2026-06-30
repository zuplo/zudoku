import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const NO_IDENTITY = "__none";
export const SECURITY_SCHEME_PREFIX = "__security:";

export type IdentitySelection =
  | { type: "none" }
  | { type: "identity"; id: string }
  | { type: "scheme"; name: string };

// The stored string encoding is private to Zudoku; public consumers work with
// `IdentitySelection` or the hooks in `useApiIdentitySelection.ts`.
export const identitySelectionToValue = (
  selection: IdentitySelection,
): string =>
  selection.type === "none"
    ? NO_IDENTITY
    : selection.type === "scheme"
      ? `${SECURITY_SCHEME_PREFIX}${selection.name}`
      : selection.id;

export const valueToIdentitySelection = (
  value: string | null | undefined,
): IdentitySelection =>
  !value || value === NO_IDENTITY
    ? { type: "none" }
    : value.startsWith(SECURITY_SCHEME_PREFIX)
      ? { type: "scheme", name: value.slice(SECURITY_SCHEME_PREFIX.length) }
      : { type: "identity", id: value };

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
