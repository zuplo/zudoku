import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface IdentityState {
  rememberedIdentity: string | null;
  setRememberedIdentity: (identity: string | null) => void;
  getRememberedIdentity: (availableIdentities: string[]) => string | undefined;
}

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
