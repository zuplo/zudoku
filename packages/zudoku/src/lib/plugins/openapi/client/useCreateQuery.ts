import { stripIgnoredCharacters } from "graphql";
import { use } from "react";
import type { TypedDocumentString } from "../graphql/graphql.js";
import { GraphQLContext } from "./GraphQLContext.js";

type NoExtraProps<T, U extends T = T> = U & {
  [K in Exclude<keyof U, keyof T>]?: never;
};

export const useCreateQuery = <TResult, TVariables>(
  query: TypedDocumentString<TResult, TVariables>,
  ...[variables]: TVariables extends Record<string, never>
    ? []
    : [NoExtraProps<TVariables>]
) => {
  const graphQLClient = use(GraphQLContext);

  if (graphQLClient === undefined) {
    throw new Error("useGraphQL must be used within a GraphQLProvider");
  }

  return {
    queryFn: () => graphQLClient.fetch(query, variables),
    queryKey: [stripIgnoredCharacters(query.toString()), variables],
  } as const;
};
