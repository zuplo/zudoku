import type { GraphQLConfig } from "@zudoku/plugin-graphql";

export const VIRTUAL_ZUPLO_CONTEXT_ID = "virtual:zudoku-zuplo-context";

export type ZuploApiEntry = {
  type: "file";
  input: string;
  path: string;
};

/**
 * The serializable result of inspecting a Zuplo project. It is computed
 * node-side (see `@zudoku/zuplo/node`) and shipped to the client through the
 * `virtual:zudoku-zuplo-context` module so both environments derive the exact
 * same configuration.
 */
export type ZuploClientContext = {
  apis: ZuploApiEntry[];
  graphql: GraphQLConfig[];
};

export const EMPTY_ZUPLO_CONTEXT: ZuploClientContext = {
  apis: [],
  graphql: [],
};
