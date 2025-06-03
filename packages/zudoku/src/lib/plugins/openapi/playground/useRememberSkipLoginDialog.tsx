import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type RememberSkipLoginState = {
  skipLogin: boolean;
  setSkipLogin: (skipLogin: boolean) => void;
};

export const useRememberSkipLoginDialog = create<RememberSkipLoginState>()(
  persist(
    (set) => ({
      skipLogin: false,
      setSkipLogin: (skipLogin: boolean) => set({ skipLogin }),
    }),
    {
      name: "remember-skip-login",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
