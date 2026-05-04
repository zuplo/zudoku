import { useLogger } from "@envelop/core";
import { createGraphQLServer } from "../../../oas/graphql/index.js";
import type { OpenApiPluginOptions } from "../index.js";

// Bounded so a query that never reaches -end doesn't accumulate (dev-only).
const MAX_PENDING = 200;
const pending = new Map<string, number>();

export const createServer = (config: OpenApiPluginOptions) =>
  createGraphQLServer({
    context: {
      schemaImports: config.schemaImports,
    },
    plugins: [
      useLogger({
        logFn: (eventName, { args }) => {
          if (import.meta.env.PROD) return;

          if (eventName.endsWith("-start")) {
            if (pending.size >= MAX_PENDING) {
              // Map iterates in insertion order, so the first key is oldest.
              const oldest = pending.keys().next().value;
              if (oldest) pending.delete(oldest);
            }
            const key = `${eventName}-${args.operationName}`;
            pending.set(key, performance.now());
          } else if (eventName.endsWith("-end")) {
            const startEvent = eventName.replace("-end", "-start");
            const key = `${startEvent}-${args.operationName}`;
            const start = pending.get(key);
            if (start) {
              // biome-ignore lint/suspicious/noConsole: Logging allowed here
              console.log(
                `[zudoku:debug] ${args.operationName} query took ${performance.now() - start}ms`,
              );
              pending.delete(key);
            }
          }
        },
      }),
    ],
  });

export type LocalServer = ReturnType<typeof createServer>;
