import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthState = create<AuthState>(() => ({
  isPending: false,
  isAuthenticated: false,
}));

export interface AuthState {
  isAuthenticated: boolean;
  isPending: boolean;
  profile?: UserProfile;
}

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
