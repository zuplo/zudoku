import { createContext } from "react";

export type RenderContextValue = {
  status: number;
  bypassProtection: boolean;
};

export const RenderContext = createContext<RenderContextValue>({
  status: 200,
  bypassProtection: false,
});
