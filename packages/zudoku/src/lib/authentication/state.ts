import { create } from "zustand";
import { persist } from "zustand/middleware";
import { shared } from "./use-broadcast/shared.js";

export interface AuthState {
  isAuthenticated: boolean;
  isPending: boolean;
  profile?: UserProfile;
}

export const useAuthState = create<AuthState>(
  shared(
    (_) => ({
      isAuthenticated: false,
      isPending: false,
      profile: undefined,
    }),
    { name: "auth-state" },
  ),
);

export interface UserProfile {
  sub: string;
  email: string | undefined;
  emailVerified: boolean;
  name: string | undefined;
  pictureUrl: string | undefined;
  [key: string]: string | boolean | undefined;
}

interface SelectedServerState {
  selectedServer?: string;
  setSelectedServer: (newServer: string) => void;
}

export const useSelectedServerStore = create<SelectedServerState>()(
  persist(
    (set) => ({
      selectedServer: undefined,
      setSelectedServer: (newServer: string) =>
        set({ selectedServer: newServer }),
    }),
    { name: "zudoku-selected-server" },
  ),
);
