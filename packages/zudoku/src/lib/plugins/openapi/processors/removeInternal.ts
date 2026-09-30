import type { ProcessorArg } from "../../../../config/validators/BuildSchema.js";
import type { OpenAPIDocument } from "../../../oas/parser/index.js";
import { removeParameters } from "./removeParameters.js";
import { removePaths } from "./removePaths.js";
import type { RecordAny } from "./traverse.js";

const COMPONENT_PARAMETER_REF = "#/components/parameters/";

const isInternal = (value: unknown) =>
  typeof value === "object" &&
  value !== null &&
  Boolean((value as RecordAny)["x-internal"]);

/**
 * Removes everything marked with `x-internal` from the schema: path items,
 * operations and parameters (including `components.parameters` and any
 * `$ref`s pointing at them).
 *
 * This is a built-in processor that runs for every Zudoku build.
 */
export const removeInternal =
  () =>
  (arg: ProcessorArg): OpenAPIDocument => {
    const componentParameters: RecordAny =
      arg.schema.components?.parameters ?? {};

    const isInternalParameter = (parameter: RecordAny) => {
      if (isInternal(parameter)) return true;
      if (
        typeof parameter.$ref !== "string" ||
        !parameter.$ref.startsWith(COMPONENT_PARAMETER_REF)
      ) {
        return false;
      }
      const name = parameter.$ref
        .slice(COMPONENT_PARAMETER_REF.length)
        .replace(/~1/g, "/")
        .replace(/~0/g, "~");
      return isInternal(componentParameters[name]);
    };

    const withoutPaths = removePaths({
      shouldRemove: ({ operation }) => isInternal(operation),
    })(arg);

    return removeParameters({
      shouldRemove: ({ parameter }) => isInternalParameter(parameter),
    })({ ...arg, schema: withoutPaths });
  };
