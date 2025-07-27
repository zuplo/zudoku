import { stripIgnoredCharacters } from "graphql";
import { use } from "react";
import type { TypedDocumentString } from "../graphql/graphql.js";
import type { GraphQLClient } from "./GraphQLClient.js";
import { GraphQLContext } from "./GraphQLContext.js";

type NoExtraProps<T, U extends T = T> = U & {
  [K in Exclude<keyof U, keyof T>]?: never;
};

type VarArgs<TVariables> = TVariables extends Record<string, never>
  ? []
  : [NoExtraProps<TVariables>];

export const createQuery = <TResult, TVariables>(
  client: GraphQLClient,
  query: TypedDocumentString<TResult, TVariables>,
  ...[variables]: TVariables extends Record<string, never>
    ? []
    : [NoExtraProps<TVariables>]
) => {
  return {
    queryFn: () => client.fetch(query, variables),
    queryKey: [stripIgnoredCharacters(query.toString()), variables],
  } as const;
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

  const args =
    variables === undefined
      ? ([] as VarArgs<TVariables>)
      : ([variables] as VarArgs<TVariables>);

  return createQuery(graphQLClient, query, ...args);
};
