import * as Sentry from "@sentry/react";
import { useEffect } from "react";
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from "react-router-dom";
import type { ZudokuConfig } from "../config/validators/validate.js";

export const initSentry = (config: NonNullable<ZudokuConfig["sentry"]>) => {
  Sentry.init({
    dsn: config.dsn,
    integrations: [
      Sentry.reactRouterV6BrowserTracingIntegration({
        useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes,
      }),
      Sentry.replayIntegration(),
    ],
  });
};
