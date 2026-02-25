import { z } from "zod/mini";
import type { UseAuthReturn } from "../../lib/authentication/hook.js";
import type { ZudokuContext } from "../../lib/core/ZudokuContext.js";
import { normalizeProtectedRoutes } from "../../lib/core/ZudokuContext.js";
import {
  type ProtectedRouteResult,
  type ReasonCode,
  REASON_CODES,
} from "./reason-codes.js";

export { REASON_CODES, type ReasonCode, type ProtectedRouteResult };

export type CallbackContext = {
  auth: UseAuthReturn;
  context: ZudokuContext;
  reasonCode: typeof REASON_CODES;
};
type ProtectedRouteCallback = (c: CallbackContext) => ProtectedRouteResult;
export type ProtectedRoutesInput = z.input<typeof ProtectedRoutesInputSchema>;
export type ProtectedRoutes = z.output<typeof ProtectedRoutesInputSchema>;

export const ProtectedRoutesInputSchema = z.optional(
  z.union([
    z.array(z.string()),
    z.record(
      z.string(),
      z.custom<ProtectedRouteCallback>((val) => typeof val === "function"),
    ),
  ]),
);

export const ProtectedRoutesSchema = z.pipe(
  ProtectedRoutesInputSchema,
  z.transform(normalizeProtectedRoutes),
);
