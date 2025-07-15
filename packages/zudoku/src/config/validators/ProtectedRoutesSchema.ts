import { z } from "zod/v4";
import type { UseAuthReturn } from "../../lib/authentication/hook.js";
import type { ZudokuContext } from "../../lib/core/ZudokuContext.js";

type CallbackContext = { auth: UseAuthReturn; context: ZudokuContext };
type ProtectedRouteCallback = (c: CallbackContext) => boolean;
export type ProtectedRoutesInput = z.input<typeof ProtectedRoutesSchema>;
export type ProtectedRoutes = z.output<typeof ProtectedRoutesSchema>;

export const ProtectedRoutesSchema = z
  .union([
    z.string().array(),
    z.record(
      z.string(),
      z.custom<ProtectedRouteCallback>((val) => typeof val === "function"),
    ),
  ])
  .optional()
  .transform((val) => {
    if (!val) return undefined;

    if (Array.isArray(val)) {
      return Object.fromEntries(
        val.map((route) => [
          route,
          (c: CallbackContext) => c.auth.isAuthenticated,
        ]),
      );
    }

    return val;
  });
