import type { ProcessorArg } from "../../../../config/validators/BuildSchema.js";
import type { AsyncAPIDocument } from "../../../asyncapi/types.js";
import { traverse as baseTraverse } from "../../../util/traverse.js";

interface RemoveExtensionsOptions {
  // Extension definitions, e.g., { 'x-internal': true }
  extensions?: Record<string, boolean>;
  shouldRemove?: (options: { extension: string; value: unknown }) => boolean;
}

export const removeExtensions =
  ({ extensions = {}, shouldRemove }: RemoveExtensionsOptions = {}) =>
  ({ schema }: ProcessorArg) =>
    baseTraverse(schema, (spec) => {
      if (!spec || typeof spec !== "object" || Array.isArray(spec)) {
        return spec;
      }

      const updated: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(spec)) {
        // Skip non-extension properties
        if (!key.startsWith("x-")) {
          updated[key] = value;
          continue;
        }

        // If the extension is explicitly marked for removal
        if (extensions[key] === true) continue;

        // If the extension should be removed via shouldRemove callback
        if (shouldRemove?.({ extension: key, value })) continue;

        updated[key] = value;
      }

      return updated;
    }) as AsyncAPIDocument;
