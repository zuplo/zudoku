import { createContext, type ReactNode } from "react";
import { GraphQLClient } from "./GraphQLClient.js";

export const GraphQLContext = createContext<GraphQLClient | undefined>(
  undefined,
);

export const GraphQLProvider = ({
  children,
  client,
}: {
  children: ReactNode;
  client: GraphQLClient;
}) => (
  <GraphQLContext.Provider value={client}>{children}</GraphQLContext.Provider>
);
