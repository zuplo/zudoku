import { createLogger, type LogLevel } from "vite";

export const logger = createLogger(
  (process.env.LOG_LEVEL ?? "info") as LogLevel,
  {
    prefix: "zudoku",
  },
);

// See https://vite.dev/config/shared-options.html#customlogger
const loggerError = logger.error;
logger.error = (msg, options) => {
  loggerError(msg, options);
  if (options?.error) {
    console.error(options.error);
  }
};

// Vite warns "dynamic import will not move module into another chunk" for shiki.ts
// because entry.server.tsx statically imports it while main.tsx dynamically imports it.
const isExpectedWarning = (msg: string) =>
  msg.includes("dynamic import will not move module into another chunk") &&
  msg.includes("shiki");

const wrapWarnFilter =
  (original: typeof logger.warn) =>
  (msg: string, options?: Parameters<typeof logger.warn>[1]) => {
    if (!isExpectedWarning(msg)) original(msg, options);
  };

logger.warn = wrapWarnFilter(logger.warn);
logger.warnOnce = wrapWarnFilter(logger.warnOnce);
