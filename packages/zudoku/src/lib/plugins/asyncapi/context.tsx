import { createContext, useContext } from "react";
import type { AsyncApiPluginContext } from "./interfaces.js";

const AsyncApiContext = createContext<
  { config: AsyncApiPluginContext } | undefined
>(undefined);

export const AsyncApiConfigProvider = AsyncApiContext.Provider;

export const useAsyncApiConfig = () => {
  const ctx = useContext(AsyncApiContext);
  if (!ctx) {
    throw new Error(
      "useAsyncApiConfig must be used within a AsyncApiConfigProvider",
    );
  }
  return ctx.config;
};
