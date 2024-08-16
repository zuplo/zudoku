import { LogLevel, createLogger } from "vite";

export const logger = createLogger(
  (process.env.LOG_LEVEL ?? "info") as LogLevel,
  {
    prefix: "zudoku",
  },
);
