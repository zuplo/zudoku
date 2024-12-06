import { type RecordAny, traverse } from "./traverse.js";

interface RemoveExtensionsOptions {
  names?: string[];
}

// Remove all `x-` prefixed key/value pairs, or filter by names if provided
export const removeExtensions =
  ({ names }: RemoveExtensionsOptions = {}) =>
  (doc: RecordAny): RecordAny =>
    traverse(doc, (spec) => {
      const result: RecordAny = {};

      for (const [key, value] of Object.entries(spec)) {
        const isExtension = key.startsWith("x-");
        const shouldRemove =
          isExtension && (names === undefined || names.includes(key));

        if (shouldRemove) continue;

        result[key] = value;
      }
      return result;
    });
