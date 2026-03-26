import { createContext, use } from "react";

export interface MonetizationConfig {
  pricing?: {
    subtitle?: string;
    title?: string;
    showYearlyPrice?: boolean;
    units?: Record<string, string>;
  };
}

export const MonetizationContext = createContext<MonetizationConfig>({});

export const useMonetizationConfig = () => use(MonetizationContext);
