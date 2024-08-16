import { create } from "zustand";

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
