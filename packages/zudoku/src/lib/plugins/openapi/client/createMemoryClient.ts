/* eslint-disable no-console */
import { cacheExchange, Client, fetchExchange, mapExchange } from "urql";
import { createServer } from "./createServer.js";
import { CreateClientFunction } from "./interfaces.js";

export type WorkerGraphQLMessage = { id: string; body: string };

const localServer = createServer();

/**
 * Creates an in memory Client that does not use Workers. This allows
 * developers to run the simple standalone version of zudoku using the CDN
 * hosted scripts. Worker's cannot be loaded cross domain so in this case
 * we sacrifice performance for making it work cross domain.
 */
export const createClient: CreateClientFunction = () => {
  return new Client({
    url: "/__z/graphql",
    // Custom fetch to send the GraphQL request to the worker and convert the response back to a `Response` object
    fetch: async (req, init) => {
      if (!init?.body) throw new Error("No body");
      const response = await localServer.fetch(
        new Request("http://localhost/__z/graphql", {
          method: "POST",
          body: init.body,
          headers: {
            "Content-Type": "application/json",
          },
        }),
      );
      return response;
      // port.postMessage({
      //   id: e.data.id,
      //   body: await response.text(),
      // } satisfies WorkerGraphQLMessage);
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
