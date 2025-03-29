import type { GraphQLError } from "graphql/error/index.js";
import { ZudokuError } from "../../../util/invariant.js";
import type { TypedDocumentString } from "../graphql/graphql.js";
import type { OpenApiPluginOptions } from "../index.js";
import type { LocalServer } from "./createServer.js";

let localServerPromise: Promise<LocalServer> | undefined;

type GraphQLResponse<TResult> = {
  errors?: GraphQLError[];
  data: TResult;
};

const throwIfError = (response: GraphQLResponse<unknown>) => {
  if (!response.errors?.[0]) return;

  throw new ZudokuError(response.errors[0].message, {
    developerHint:
      "Check your configuration value `apis.type` and `apis.input` in the Zudoku config.",
  });
};

export class GraphQLClient {
  constructor(private readonly config: OpenApiPluginOptions) {}

  #getLocalServer = async () => {
    if (!localServerPromise) {
      localServerPromise = import("./createServer.js").then((m) =>
        m.createServer(this.config),
      );
    }
    return localServerPromise;
  };

  #executeFetch = async (init: RequestInit): Promise<Response> => {
    if (this.config.server) {
      return fetch(this.config.server, init);
    }

    const localServer = await this.#getLocalServer();
    return localServer.fetch("http://localhost/graphql", init);
  };

  fetch = async <TResult, TVariables>(
    query: TypedDocumentString<TResult, TVariables>,
    variables?: TVariables,
  ): Promise<TResult> => {
    const operationName = query.match(/query (\w+)/)?.[1];

    const response = await this.#executeFetch({
      method: "POST",
      body: JSON.stringify({ query, variables, operationName }),
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const result = (await response.json()) as GraphQLResponse<TResult>;
    throwIfError(result);

    return result.data;
  };
}
