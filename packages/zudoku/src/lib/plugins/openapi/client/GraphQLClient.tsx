import type { GraphQLError } from "graphql/error/index.js";
import { ulid } from "ulidx";
import { initializeWorker } from "zudoku/openapi-worker";
import { ZudokuError } from "../../../util/invariant.js";
import type { TypedDocumentString } from "../graphql/graphql.js";
import type { OpenApiPluginOptions } from "../index.js";
import type { LocalServer } from "./createServer.js";
import type { WorkerGraphQLMessage } from "./worker.js";

let localServerPromise: Promise<LocalServer> | undefined;
let worker: SharedWorker | undefined;

type GraphQLResponse<TResult> = {
  errors?: GraphQLError[];
  data: TResult;
};

const resolveVariables = async (variables?: unknown) => {
  if (!variables) return;

  if (
    typeof variables === "object" &&
    "type" in variables &&
    variables.type === "file" &&
    "input" in variables &&
    typeof variables.input === "function"
  ) {
    variables.input = await variables.input();
  }
};

const throwIfError = (response: GraphQLResponse<unknown>) => {
  if (!response.errors?.[0]) return;

  throw new ZudokuError(response.errors[0].message, {
    developerHint:
      "Check your configuration value `apis.type` and `apis.input` in the Zudoku config.",
  });
};

export class GraphQLClient {
  readonly #mode: "remote" | "in-memory" | "worker";
  #pendingRequests = new Map<string, (value: any) => void>();
  #port: MessagePort | undefined;

  constructor(private config: OpenApiPluginOptions) {
    if (config.server) {
      this.#mode = "remote";
    } else if (config.inMemory || typeof SharedWorker === "undefined") {
      this.#mode = "in-memory";
    } else {
      this.#mode = "worker";
    }
  }

  #initializeLocalServer = () =>
    import("./createServer.js").then((m) => m.createServer());

  fetch = async <TResult, TVariables>(
    query: TypedDocumentString<TResult, TVariables>,
    ...[variables]: TVariables extends Record<string, never> ? [] : [TVariables]
  ) => {
    const operationName = query.match(/query (\w+)/)?.[1];

    await resolveVariables(variables);

    const body = JSON.stringify({ query, variables, operationName });

    switch (this.#mode) {
      case "remote": {
        const response = await fetch(this.config.server!, {
          method: "POST",
          body,
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const result = (await response.json()) as GraphQLResponse<TResult>;
        throwIfError(result);

        return result.data;
      }

      case "in-memory": {
        if (!localServerPromise) {
          localServerPromise = this.#initializeLocalServer();
        }

        const localServer = await localServerPromise;
        if (!localServer) throw new Error("Local server not initialized");

        const response = await localServer.fetch(
          new Request("http://localhost/graphql", {
            method: "POST",
            body,
            headers: { "Content-Type": "application/json" },
          }),
        );

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const result = (await response.json()) as GraphQLResponse<TResult>;
        throwIfError(result);

        return result.data;
      }

      case "worker": {
        if (!worker) {
          worker = initializeWorker();
        }

        if (!this.#port) {
          const channel = new MessageChannel();

          worker.port.postMessage({ port: channel.port2 }, [channel.port2]);

          this.#port = channel.port1;

          this.#port.onmessage = (e: MessageEvent<WorkerGraphQLMessage>) => {
            const { id, body } = e.data;
            const resolve = this.#pendingRequests.get(id);
            if (resolve) {
              const result = JSON.parse(body);
              resolve(result);
              this.#pendingRequests.delete(id);
            } else {
              // eslint-disable-next-line no-console
              console.error(`No pending request found for id: ${id}`);
            }
          };

          this.#port.start();
        }

        const id = ulid();

        const resultPromise = new Promise<GraphQLResponse<TResult>>(
          (resolve) => {
            this.#pendingRequests.set(id, resolve);
            this.#port!.postMessage({ id, body } as WorkerGraphQLMessage);
          },
        );

        const result = await resultPromise;
        throwIfError(result);

        return result.data;
      }
    }
  };
}
