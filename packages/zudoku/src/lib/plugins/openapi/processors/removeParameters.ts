import type { ProcessorArg } from "../../../../config/validators/BuildSchema.js";
import type { OpenAPIDocument } from "../../../oas/parser/index.js";
import { type RecordAny, traverse } from "./traverse.js";

interface RemoveParametersOptions {
  // Names of parameters to remove
  names?: string[];
  // Specific locations to remove parameters from ('query', 'header', 'path', 'cookie')
  in?: string[];
  // Custom filter function
  shouldRemove?: ({ parameter }: { parameter: RecordAny }) => boolean;
}

export const removeParameters =
  ({ names, in: locations, shouldRemove }: RemoveParametersOptions = {}) =>
  ({ schema }: ProcessorArg) =>
    traverse(schema, (spec) => {
      // Helper function to filter parameters
      const filterParameters = (parameters: RecordAny[]) =>
        parameters.filter((p) => {
          if (names?.includes(p.name)) return false;
          if (locations?.includes(p.in)) return false;
          if (shouldRemove?.({ parameter: p })) return false;
          return true;
        });

      // Handle components.parameters
      if (spec.components?.parameters) {
        spec = {
          ...spec,
          components: {
            ...spec.components,
            parameters: Object.fromEntries(
              Object.entries(spec.components.parameters).filter(
                ([_, param]) => {
                  const p = param as RecordAny;
                  if (p.$ref) return true; // Skip references
                  return (
                    !names?.includes(p.name) &&
                    !locations?.includes(p.in) &&
                    !shouldRemove?.({ parameter: p })
                  );
                },
              ),
            ),
          },
        };
      }

      // Handle paths
      if (spec.paths) {
        const updatedPaths: RecordAny = {};

        for (const [path, pathItem] of Object.entries(spec.paths)) {
          if (typeof pathItem !== "object" || pathItem === null) {
            updatedPaths[path] = pathItem;
            continue;
          }

          let updatedPathItem = { ...pathItem };

          // Handle path-level parameters
          if (
            "parameters" in updatedPathItem &&
            Array.isArray(updatedPathItem.parameters)
          ) {
            updatedPathItem.parameters = filterParameters(
              updatedPathItem.parameters,
            );
          }

          // Handle operation-level parameters
          for (const method of Object.keys(updatedPathItem)) {
            const pathItemWithMethods = updatedPathItem as Record<
              string,
              RecordAny
            >;

            if (
              method === "parameters" ||
              typeof pathItemWithMethods[method] !== "object"
            ) {
              continue;
            }

            const operation = pathItemWithMethods[method];
            if (Array.isArray(operation.parameters)) {
              pathItemWithMethods[method] = {
                ...operation,
                parameters: filterParameters(operation.parameters),
              };
              updatedPathItem = pathItemWithMethods;
            }
          }

          updatedPaths[path] = updatedPathItem;
        }

        spec = { ...spec, paths: updatedPaths };
      }

      return spec;
    }) as OpenAPIDocument;
