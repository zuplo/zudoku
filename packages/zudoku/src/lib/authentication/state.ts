import { create, type Mutate, type StoreApi } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface AuthState<ProviderData = unknown> {
  isAuthenticated: boolean;
  isPending: boolean;
  profile: UserProfile | null;
  providerData: ProviderData | null;
}

export class Authentication {
  async setLoggedIn(isLoggedIn: boolean) {}
  async setProfile() {}
  async setPersistentProviderData() {}
}

export type StoreWithPersist<T> = Mutate<
  StoreApi<T>,
  [["zustand/persist", unknown]]
>;

const withStorageDOMEvents = <T>(store: StoreWithPersist<T>) => {
  const storageEventCallback = (e: StorageEvent) => {
    if (e.key === store.persist.getOptions().name && e.newValue) {
      void store.persist.rehydrate();
    }
  };

  window.addEventListener("storage", storageEventCallback);

  return () => {
    window.removeEventListener("storage", storageEventCallback);
  };
};

export const useAuthState = create<AuthState>()(
  persist(
    (state) => ({
      isAuthenticated: false,
      isPending: true,
      profile: null,
      providerData: null,
    }),
    {
      merge: (persistedState, currentState) => {
        return {
          ...currentState,
          isPending: false,
          ...(typeof persistedState === "object" ? persistedState : {}),
        };
      },
      name: "auth-state",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

if (typeof window !== "undefined") {
  withStorageDOMEvents(useAuthState);
}

export interface UserProfile {
  sub: string;
  email: string | undefined;
  emailVerified: boolean;
  name: string | undefined;
  pictureUrl: string | undefined;
  [key: string]: string | boolean | undefined;
}
