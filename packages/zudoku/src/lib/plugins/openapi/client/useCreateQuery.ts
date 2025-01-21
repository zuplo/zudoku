import { useContext } from "react";
import type { TypedDocumentString } from "../graphql/graphql.js";
import { GraphQLContext } from "./GraphQLContext.js";

export const useCreateQuery = <TResult, TVariables>(
  query: TypedDocumentString<TResult, TVariables>,
  ...variables: TVariables extends Record<string, never> ? [] : [TVariables]
) => {
  const graphQLClient = useContext(GraphQLContext);
  if (graphQLClient === undefined) {
    throw new Error("useGraphQL must be used within a GraphQLProvider");
  }

  return {
    queryFn: () => graphQLClient.fetch(query, ...variables),
    queryKey: [query, variables[0]],
  } as const;
};
