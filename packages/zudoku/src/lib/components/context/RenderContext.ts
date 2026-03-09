import { createContext } from "react";
import type { UserProfile } from "../../authentication/state.js";

export type SSRAuthState = {
  accessToken?: string;
  profile: UserProfile;
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
