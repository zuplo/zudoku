import { z } from "zod";
import type { UseAuthReturn } from "../../lib/authentication/hook.js";
import type { ZudokuContext } from "../../lib/core/ZudokuContext.js";
import { normalizeProtectedRoutes } from "../../lib/core/ZudokuContext.js";

export const REASON_CODES = {
  UNAUTHORIZED: "unauthorized",
  FORBIDDEN: "forbidden",
} as const;

export type ReasonCode = (typeof REASON_CODES)[keyof typeof REASON_CODES];
export type ProtectedRouteResult = boolean | ReasonCode;

export type CallbackContext = {
  auth: UseAuthReturn;
  context: ZudokuContext;
  reasonCode: typeof REASON_CODES;
};
type ProtectedRouteCallback = (c: CallbackContext) => ProtectedRouteResult;
export type ProtectedRoutesInput = z.input<typeof ProtectedRoutesInputSchema>;
export type ProtectedRoutes = z.output<typeof ProtectedRoutesInputSchema>;

export const ProtectedRoutesInputSchema = z
  .union([
    z.string().array(),
    z.record(
      z.string(),
      z.custom<ProtectedRouteCallback>((val) => typeof val === "function"),
    ),
  ])
  .optional();

export const ProtectedRoutesSchema = ProtectedRoutesInputSchema.transform(
  normalizeProtectedRoutes,
);
