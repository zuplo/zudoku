import { useContext } from "react";
import type { TypedDocumentString } from "../graphql/graphql.js";
import { GraphQLContext } from "./GraphQLContext.js";

export const useCreateQuery = <TResult, TVariables>(
  query: TypedDocumentString<TResult, TVariables>,
  ...variables: TVariables extends Record<string, never> ? [] : [TVariables]
) => {
  const graphqlClient = useContext(GraphQLContext);
  if (graphqlClient === undefined) {
    throw new Error("useGraphQL must be used within a GraphQLProvider");
  }

  return {
    queryFn: () => graphqlClient.fetch(query, ...variables),
    queryKey: [query, variables],
    retry: false,
  } as const;
};
