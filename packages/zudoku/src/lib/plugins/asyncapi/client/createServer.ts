import { useLogger } from "@envelop/core";
import { createGraphQLServer } from "../../../asyncapi/graphql/index.js";
import type { AsyncApiPluginConfig } from "../interfaces.js";

const map = new Map<string, number>();

/**
 * Creates the GraphQL server for AsyncAPI
 */
export const createServer = (config: AsyncApiPluginConfig) =>
  createGraphQLServer(config.schemaImports ?? config.input, {
    plugins: [
      useLogger({
        logFn: (eventName, { args }) => {
          if (import.meta.env.PROD) return;

          if (eventName.endsWith("-start")) {
            map.set(`${eventName}-${args.operationName}`, performance.now());
          } else if (eventName.endsWith("-end")) {
            const startEvent = eventName.replace("-end", "-start");
            const start = map.get(`${startEvent}-${args.operationName}`);
            if (start) {
              // biome-ignore lint/suspicious/noConsole: Logging allowed here
              console.log(
                `[zudoku:asyncapi] ${args.operationName} query took ${performance.now() - start}ms`,
              );
              map.delete(`${startEvent}-${args.operationName}`);
            }
          }
        },
      }),
    ],
  });

export type LocalServer = ReturnType<typeof createServer>;
