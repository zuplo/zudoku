import type { ZudokuSpec } from "zudoku/vite";
import { ensureArray } from "../util/ensureArray.js";
import { inspectZuploContext } from "./inspect.js";

export type ExtendSpecOptions = {
  /** The dev portal root directory (where the Zudoku config lives) */
  rootDir: string;
};

/**
 * Extends a Zudoku spec with what the surrounding Zuplo project provides: an
 * OpenAPI (`apis`) entry per detected OpenAPI file and a GraphQL plugin per
 * detected GraphQL endpoint. Called by `zudoku generate` before the spec is
 * compiled into the base config layer, so the detected configuration ends up
 * as static, typed config like everything else.
 *
 * Entries the spec already configures (same file, path or endpoint) are left
 * untouched. Returns the spec unchanged when there is no Zuplo project next
 * to the dev portal.
 */
export const extendSpec = async (
  spec: ZudokuSpec,
  { rootDir }: ExtendSpecOptions,
): Promise<ZudokuSpec> => {
  const { apis, graphql } = await inspectZuploContext({ rootDir, spec });
  if (apis.length === 0 && graphql.length === 0) return spec;

  return {
    ...spec,
    ...(apis.length > 0
      ? { apis: [...(spec.apis ? ensureArray(spec.apis) : []), ...apis] }
      : {}),
    ...(graphql.length > 0
      ? {
          plugins: [
            ...(spec.plugins ?? []),
            ...graphql.map((options) => ({
              name: "graphql" as const,
              options,
            })),
          ],
        }
      : {}),
  };
};
