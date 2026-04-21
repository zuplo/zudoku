import { createContext } from "react";
import type { UserProfile } from "../../authentication/state.js";

export type SSRAuthState = {
  accessToken?: string;
  // `null` means the user is logged out; undefined means auth isn't configured.
  profile: UserProfile | null;
};

export type RenderContextValue = {
  status: number;
  bypassProtection: boolean;
  ssrAuth?: SSRAuthState;
};

export const RenderContext = createContext<RenderContextValue>({
  status: 200,
  bypassProtection: false,
});
