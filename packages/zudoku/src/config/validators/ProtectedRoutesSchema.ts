import { z } from "zod";
import type { UseAuthReturn } from "../../lib/authentication/hook.js";
import type { ZudokuContext } from "../../lib/core/ZudokuContext.js";
import { transformProtectedRoutes } from "../../lib/core/ZudokuContext.js";

export type CallbackContext = { auth: UseAuthReturn; context: ZudokuContext };
type ProtectedRouteCallback = (c: CallbackContext) => boolean;
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
  transformProtectedRoutes,
);
