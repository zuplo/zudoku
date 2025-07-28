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
