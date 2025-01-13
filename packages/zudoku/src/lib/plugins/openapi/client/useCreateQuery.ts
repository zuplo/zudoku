import hashit from "object-hash";
import { useContext, useMemo } from "react";
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

  const hash = useMemo(() => {
    if (
      typeof variables[0] === "object" &&
      variables[0] != null &&
      "input" in variables[0] &&
      typeof variables[0].input === "function"
    ) {
      // This is a pre-hashed name to ensure that the query key is consistent across server and client
      return variables[0].input.name;
    }

    return hashit(variables[0] ?? {});
  }, [variables]);

  return {
    queryFn: () => graphQLClient.fetch(query, ...variables),
    queryKey: [query, hash],
  } as const;
};
