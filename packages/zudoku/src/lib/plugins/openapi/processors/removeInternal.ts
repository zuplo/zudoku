import type { ProcessorArg } from "../../../../config/validators/BuildSchema.js";
import { removeParameters } from "./removeParameters.js";
import { removePaths } from "./removePaths.js";

// Built-in processor that runs for every build: removes paths, operations and
// parameters marked with `x-internal`.
export const removeInternal = () => (arg: ProcessorArg) =>
  removeParameters({
    shouldRemove: ({ parameter }) => parameter["x-internal"],
  })({
    ...arg,
    schema: removePaths({
      shouldRemove: ({ operation }) => operation["x-internal"],
    })(arg),
  });
