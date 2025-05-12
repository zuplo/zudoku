import type { ProcessorArg } from "../../../../config/validators/BuildSchema.js";
import type { OpenAPIDocument } from "../../../oas/parser/index.js";
import { type RecordAny, traverse } from "./traverse.js";

interface RemovePathsOptions {
  // Path definitions, e.g., { '/path': true, '/path-2': ['get'] }
  paths?: Record<string, true | string[]>;
  shouldRemove?: (options: {
    path: string;
    method: true | string;
    operation: RecordAny;
  }) => boolean;
}

export const removePaths =
  ({ paths = {}, shouldRemove }: RemovePathsOptions) =>
  ({ schema }: ProcessorArg) =>
    traverse(schema, (spec) => {
      if (!spec.paths) return spec;

      const updatedPaths: RecordAny = {};

      for (const [path, methods] of Object.entries(spec.paths)) {
        const operations = spec.paths[path];

        // If the path is explicitly marked for removal in `paths`
        if (paths[path] === true) continue;

        // If the path should be removed via `shouldRemove`
        if (shouldRemove?.({ path, method: true, operation: operations }))
          continue;

        if (typeof methods === "object" && methods !== null) {
          const filteredPath = Object.fromEntries(
            Object.entries(methods).filter(([method]) => {
              const operations = spec.paths[path][method];
              const isMethodToRemove =
                Array.isArray(paths[path]) && paths[path].includes(method);

              const isMethodFiltered = shouldRemove?.({
                path,
                method,
                operation: operations,
              });

              return !isMethodToRemove && !isMethodFiltered;
            }),
          );

          updatedPaths[path] = filteredPath;
        } else {
          updatedPaths[path] = methods;
        }
      }

      return { ...spec, paths: updatedPaths };
    }) as OpenAPIDocument;
