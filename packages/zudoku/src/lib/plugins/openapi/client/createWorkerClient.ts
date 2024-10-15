/* eslint-disable no-console */
import { monotonicFactory } from "ulidx";
import { cacheExchange, Client, fetchExchange, mapExchange } from "urql";
import { createWaitForNotify } from "../../../util/createWaitForNotify.js";
import { createClient as createMemoryClient } from "./createMemoryClient.js";
import { CreateClientFunction } from "./interfaces.js";

export type WorkerGraphQLMessage = { id: string; body: string };
const ulid = monotonicFactory();

/**
 * This loads the client from a worker and uses mess port to send requests
 * and responses between the main thread and the worker.
 */
export const createClient: CreateClientFunction = ({
  useMemoryClient,
}: {
  useMemoryClient: boolean;
}) => {
  if (useMemoryClient || typeof SharedWorker === "undefined") {
    return createMemoryClient({ useMemoryClient });
  }
  // NOTE: This URL needs to be inline with the SharedWorker otherwse
  // vite build does not recognize the worker file as a module.
  const worker = new SharedWorker(new URL("./worker.ts", import.meta.url), {
    type: "module",
  });

  worker.onerror = (e) => {
    console.error(e);
  };

  worker.port.start();

  const [waitFor, notify] = createWaitForNotify<string>();

  worker.port.onmessage = (e: MessageEvent<WorkerGraphQLMessage>) => {
    notify(e.data.id, e.data.body);
  };

  return new Client({
    url: "/__z/graphql",
    // Custom fetch to send the GraphQL request to the worker and convert the response back to a `Response` object
    fetch: async (_req, init) => {
      if (!init?.body) throw new Error("No body");

      const id = ulid();
      worker.port.postMessage({
        id,
        body: init.body as string,
      } satisfies WorkerGraphQLMessage);

      const body = await waitFor(id);

      return new Response(body, {
        headers: {
          "Content-Type": "application/json",
        },
      });
    },
    exchanges: [
      cacheExchange,
      mapExchange({
        onError(error, operation) {
          console.error(error);
          console.groupCollapsed("Operation info");
          console.log("body", operation.query.loc?.source.body.trim());
          console.log("variables", operation.variables);
          console.groupEnd();
        },
      }),
      fetchExchange,
    ],
  });
};
