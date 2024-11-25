import { createContext, type ReactNode, useMemo } from "react";
import { useOasConfig } from "../context.js";
import { GraphQLClient } from "./GraphQLClient.js";

export const GraphQLContext = createContext<GraphQLClient | undefined>(
  undefined,
);

export const GraphQLProvider = ({ children }: { children: ReactNode }) => {
  const config = useOasConfig();
  const client = useMemo(() => new GraphQLClient(config), [config]);

  return (
    <GraphQLContext.Provider value={client}>{children}</GraphQLContext.Provider>
  );
};
