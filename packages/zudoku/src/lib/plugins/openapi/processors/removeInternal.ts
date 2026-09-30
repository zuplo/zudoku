import type { ProcessorArg } from "../../../../config/validators/BuildSchema.js";
import type { OpenAPIDocument } from "../../../oas/parser/index.js";
import { unescapeJsonPointer } from "../schema/utils.js";
import { removeParameters } from "./removeParameters.js";
import { removePaths } from "./removePaths.js";
import type { RecordAny } from "./traverse.js";

const isObject = (value: unknown): value is RecordAny =>
  typeof value === "object" && value !== null;

/**
 * Removes everything marked with `x-internal` from the schema: path items,
 * operations and parameters. Local `$ref`s are followed, so references and
 * aliases (`components.parameters`, `components.pathItems`) of internal items
 * are removed as well.
 *
 * This is a built-in processor that runs for every Zudoku build.
 */
export const removeInternal =
  () =>
  (arg: ProcessorArg): OpenAPIDocument => {
    const lookup = (ref: string): unknown => {
      try {
        return ref
          .slice(2)
          .split("/")
          .map(unescapeJsonPointer)
          .reduce<unknown>(
            (node, key) => (isObject(node) ? node[key] : undefined),
            arg.schema,
          );
      } catch {
        return undefined;
      }
    };

    // Resolved against the input schema, so refs to already removed targets
    // still resolve.
    const isInternal = (value: unknown, seen = new Set<string>()): boolean => {
      if (!isObject(value)) return false;
      if (value["x-internal"]) return true;
      const ref = value.$ref;
      if (typeof ref !== "string" || !ref.startsWith("#/") || seen.has(ref)) {
        return false;
      }
      seen.add(ref);
      return isInternal(lookup(ref), seen);
    };

    const removeInternalParameters = removeParameters({
      shouldRemove: ({ parameter }) => isInternal(parameter),
    });

    const schema = removeInternalParameters({
      ...arg,
      schema: removePaths({
        shouldRemove: ({ operation }) => isInternal(operation),
      })(arg),
    });

    const components: RecordAny | undefined = schema.components;
    if (!components) return schema;

    const parameters: RecordAny | undefined = components.parameters;
    const pathItems: RecordAny | undefined = components.pathItems;

    const result: RecordAny = {
      ...schema,
      components: {
        ...components,
        // `removeParameters` keeps all `$ref` entries, so drop aliases here
        ...(parameters && {
          parameters: Object.fromEntries(
            Object.entries(parameters).filter(([, p]) => !isInternal(p)),
          ),
        }),
        // Referenced path items keep their entry (other refs may point to
        // them), but lose their internal operations and parameters.
        ...(pathItems && {
          pathItems: removeInternalParameters({
            ...arg,
            schema: removePaths({
              shouldRemove: ({ method, operation }) =>
                method !== true && isInternal(operation),
            })({ ...arg, schema: { paths: pathItems } as OpenAPIDocument }),
          }).paths,
        }),
      },
    };

    return result as OpenAPIDocument;
  };
