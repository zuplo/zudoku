import { type RecordAny, traverse } from "./traverse.js";

interface RemovePathsOptions {
  // Path definitions, e.g., { '/path': true, '/path-2': ['get'] }
  paths?: Record<string, true | string[]>;
  filter?: (path: string, method: true | string, obj: RecordAny) => boolean;
}

export const removePaths =
  ({ paths = {}, filter }: RemovePathsOptions) =>
  (doc: RecordAny): RecordAny =>
    traverse(doc, (spec) => {
      if (!spec.paths) return spec;

      const updatedPaths: RecordAny = {};

      for (const [path, methods] of Object.entries(spec.paths)) {
        if (filter && !filter(path, true, spec.paths[path])) continue;

        if (typeof methods === "object" && methods !== null) {
          const filteredPath = Object.fromEntries(
            Object.entries(methods).filter(([method]) => {
              const isMethodToRemove =
                Array.isArray(paths[path]) && paths[path].includes(method);
              const isMethodFiltered = filter?.(
                path,
                method,
                spec.paths[path][method],
              );

              return isMethodToRemove || isMethodFiltered;
            }),
          );

          if (Object.keys(filteredPath).length > 0) {
            updatedPaths[path] = filteredPath;
          }
        } else {
          updatedPaths[path] = methods;
        }
      }

      return { ...spec, paths: updatedPaths };
    });
