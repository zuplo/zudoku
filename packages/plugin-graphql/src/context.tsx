import { createContext, type PropsWithChildren, use } from "react";
import type { GraphQLPluginOptions } from "./interfaces.js";
import type { GraphQLSchema } from "./util/findType.js";

type GraphQLContextValue = {
  schema: GraphQLSchema;
  basePath: string;
  options: GraphQLPluginOptions;
};

const GraphQLContext = createContext<GraphQLContextValue | undefined>(
  undefined,
);

export const GraphQLProvider = ({
  children,
  value,
}: PropsWithChildren<{ value: GraphQLContextValue }>) => (
  <GraphQLContext.Provider value={value}>{children}</GraphQLContext.Provider>
);

export const useGraphQLSchema = (): GraphQLContextValue => {
  const ctx = use(GraphQLContext);
  if (!ctx)
    throw new Error("useGraphQLSchema must be used within GraphQLProvider");

  return ctx;
};
