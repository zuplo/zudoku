import type { GraphQLError } from "graphql/error/index.js";
import { ulid } from "ulidx";
import { createWaitForNotify } from "../../../util/createWaitForNotify.js";
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

const throwIfError = (response: GraphQLResponse<unknown>) => {
  if (!response.errors?.[0]) return;

  throw new ZudokuError(response.errors[0].message, {
    developerHint:
      "Check your configuration value `apis.type` and `apis.input` in the Zudoku config.",
  });
};

export class GraphQLClient {
  readonly #mode: "remote" | "in-memory" | "worker";

  constructor(private config: OpenApiPluginOptions) {
    if (config.server) {
      this.#mode = "remote";
    } else if (config.inMemory || typeof SharedWorker === "undefined") {
      this.#mode = "in-memory";
      localServerPromise = this.initializeLocalServer();
    } else {
      this.#mode = "worker";
      worker = this.initializeWorker();
    }
  }

  private initializeLocalServer = async () =>
    await import("./createServer.js").then((m) => m.createServer());

  private initializeWorker = () => {
    const worker = new SharedWorker(new URL("./worker.ts", import.meta.url), {
      type: "module",
    });
    // eslint-disable-next-line no-console
    worker.onerror = (e) => console.error(e);
    worker.port.start();

    return worker;
  };

  fetch = async <TResult, TVariables>(
    query: TypedDocumentString<TResult, TVariables>,
    ...[variables]: TVariables extends Record<string, never> ? [] : [TVariables]
  ) => {
    const operationName = query.match(/query (\w+)/)?.[1];
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
        if (!worker) throw new Error("Worker not initialized");

        const [waitFor, notify] =
          createWaitForNotify<GraphQLResponse<TResult>>();

        worker.port.onmessage = (e: MessageEvent<WorkerGraphQLMessage>) => {
          notify(e.data.id, JSON.parse(e.data.body));
        };

        const id = ulid();
        worker.port.postMessage({ id, body } as WorkerGraphQLMessage);

        const result = await waitFor(id);

        throwIfError(result);

        return result.data;
      }
    }
  };
}
