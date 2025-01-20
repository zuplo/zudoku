import { useLogger } from "@envelop/core";
import { createGraphQLServer } from "../../../oas/graphql/index.js";
import type { OpenApiPluginOptions } from "../index.js";

const map = new Map<string, number>();

/**
 * Creates the GraphQL server
 */
export const createServer = (config: OpenApiPluginOptions) =>
  createGraphQLServer({
    context: {
      schemaImports: config.schemaImports,
    },
    plugins: [
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useLogger({
        logFn: (eventName, { args }) => {
          if (import.meta.env.PROD) return;

          if (eventName.endsWith("-start")) {
            map.set(`${eventName}-${args.operationName}`, performance.now());
          } else if (eventName.endsWith("-end")) {
            const startEvent = eventName.replace("-end", "-start");
            const start = map.get(`${startEvent}-${args.operationName}`);
            if (start) {
              // eslint-disable-next-line no-console
              console.log(
                `[zudoku:debug] ${args.operationName} query took ${performance.now() - start}ms`,
              );
              map.delete(`${startEvent}-${args.operationName}`);
            }
          }
        },
      }),
    ],
  });

export type LocalServer = ReturnType<typeof createServer>;
