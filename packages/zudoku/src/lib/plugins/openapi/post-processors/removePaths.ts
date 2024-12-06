import { type RecordAny, traverse } from "./traverse.js";

interface RemovePathsOptions {
  // Path definitions, e.g., { '/path': true, '/path-2': ['get'] }
  paths?: Record<string, true | string[]>;
  shouldRemove?: (options: {
    path: string;
    method: true | string;
    obj: RecordAny;
  }) => boolean;
}

export const removePaths =
  ({ paths = {}, shouldRemove }: RemovePathsOptions) =>
  (doc: RecordAny): RecordAny =>
    traverse(doc, (spec) => {
      if (!spec.paths) return spec;

      const updatedPaths: RecordAny = {};

      for (const [path, methods] of Object.entries(spec.paths)) {
        const obj = spec.paths[path];

        // If the path is explicitly marked for removal in `paths`
        if (paths[path] === true) continue;

        // If the path should be removed via `shouldRemove`
        if (shouldRemove?.({ path, method: true, obj })) continue;

        if (typeof methods === "object" && methods !== null) {
          const filteredPath = Object.fromEntries(
            Object.entries(methods).filter(([method]) => {
              const obj = spec.paths[path][method];
              const isMethodToRemove =
                Array.isArray(paths[path]) && paths[path].includes(method);

              const isMethodFiltered = shouldRemove?.({ path, method, obj });

              return !isMethodToRemove && !isMethodFiltered;
            }),
          );

          updatedPaths[path] = filteredPath;
        } else {
          updatedPaths[path] = methods;
        }
      }

      return { ...spec, paths: updatedPaths };
    });
