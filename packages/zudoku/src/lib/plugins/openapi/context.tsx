import { createContext, useContext } from "react";
import { type OasPluginContext } from "./interfaces.js";

const OasContext = createContext<{ config: OasPluginContext } | undefined>(
  undefined,
);

export const OasConfigProvider = OasContext.Provider;

export const useOasConfig = () => {
  const ctx = useContext(OasContext);
  if (!ctx) {
    throw new Error("useOasConfig must be used within a OasConfigProvider");
  }
  return ctx.config;
};
