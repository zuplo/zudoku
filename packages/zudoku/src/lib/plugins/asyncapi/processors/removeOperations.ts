import type { AsyncAPIDocument } from "../../../asyncapi/types.js";
import type { AsyncApiProcessorArg } from "../interfaces.js";
import { type RecordAny, traverse } from "./traverse.js";

interface RemoveOperationsOptions {
  // Operation definitions, e.g., { 'onUserSignup': true }
  operations?: Record<string, boolean>;
  shouldRemove?: (options: {
    operationId: string;
    operation: RecordAny;
  }) => boolean;
}

export const removeOperations =
  ({ operations = {}, shouldRemove }: RemoveOperationsOptions = {}) =>
  ({ schema }: AsyncApiProcessorArg) =>
    traverse(schema, (spec) => {
      if (!spec.operations) return spec;

      const updatedOperations: RecordAny = {};

      for (const [operationId, operation] of Object.entries(
        spec.operations as RecordAny,
      )) {
        // If the operation is explicitly marked for removal
        if (operations[operationId] === true) continue;

        // If the operation should be removed via shouldRemove callback
        if (shouldRemove?.({ operationId, operation: operation as RecordAny }))
          continue;

        updatedOperations[operationId] = operation;
      }

      return { ...spec, operations: updatedOperations };
    }) as AsyncAPIDocument;
