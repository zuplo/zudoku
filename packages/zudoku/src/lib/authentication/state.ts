import { create, type Mutate, type StoreApi } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface AuthState<ProviderData = unknown> {
  isAuthenticated: boolean;
  isPending: boolean;
  profile: UserProfile | null;
  providerData: ProviderData | null;
  setAuthenticationPending: () => void;
  setLoggedOut: () => void;
  setLoggedIn: ({
    profile,
    providerData,
  }: {
    profile: UserProfile;
    providerData: unknown;
  }) => void;
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
    (set) => ({
      isAuthenticated: false,
      isPending: true,
      profile: null,
      providerData: null,
      setAuthenticationPending: () =>
        set(() => ({
          isAuthenticated: false,
          isPending: false,
          profile: null,
          providerData: null,
        })),
      setLoggedOut: () =>
        set(() => ({
          isAuthenticated: false,
          isPending: false,
          profile: null,
          providerData: null,
        })),
      setLoggedIn: ({
        profile,
        providerData,
      }: {
        profile: UserProfile;
        providerData: unknown;
      }) =>
        set(() => ({
          isAuthenticated: true,
          isPending: false,
          profile,
          providerData,
        })),
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
