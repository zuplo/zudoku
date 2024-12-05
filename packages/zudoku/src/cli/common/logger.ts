import { LogLevel, createLogger } from "vite";

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
    // eslint-disable-next-line no-console
    console.error(options.error);
  }
};
