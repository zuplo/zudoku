import type { ProcessorArg } from "../../../../config/validators/BuildSchema.js";
import type { OpenAPIDocument } from "../../../oas/parser/index.js";
import { type RecordAny, traverse } from "./traverse.js";

interface RemoveExtensionsOptions {
  keys?: string[];
  shouldRemove?: (key: string) => boolean;
}

// Remove all `x-` prefixed key/value pairs, or filter by names if provided
export const removeExtensions =
  ({ keys, shouldRemove }: RemoveExtensionsOptions = {}) =>
  ({ schema }: ProcessorArg) =>
    traverse(schema, (spec) => {
      const result: RecordAny = {};

      for (const [key, value] of Object.entries(spec)) {
        const isExtension = key.startsWith("x-");
        const shouldBeRemoved =
          isExtension &&
          (keys === undefined || keys.includes(key)) &&
          (!shouldRemove || shouldRemove(key));

        if (shouldBeRemoved) continue;

        result[key] = value;
      }
      return result;
    }) as OpenAPIDocument;
