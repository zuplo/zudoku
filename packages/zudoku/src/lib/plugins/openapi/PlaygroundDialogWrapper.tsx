import type {
  MediaTypeObject,
  OperationsFragmentFragment,
} from "./graphql/graphql.js";
import { PlaygroundDialog } from "./playground/PlaygroundDialog.js";
import { generateSchemaExample } from "./util/generateSchemaExample.js";

const getParameterExampleValue = (
  // biome-ignore lint/suspicious/noExplicitAny: Schema is untyped JSON
  schema: any | null | undefined,
  name: string,
): string | undefined => {
  const example = generateSchemaExample(schema, name);
  if (example === null || example === undefined) return undefined;
  if (typeof example === "object") return JSON.stringify(example);
  return String(example);
};

export const PlaygroundDialogWrapper = ({
  server,
  servers,
  operation,
  examples,
}: {
  server?: string;
  servers?: string[];
  operation: OperationsFragmentFragment;
  examples?: MediaTypeObject[];
}) => {
  const headers = operation.parameters
    ?.filter((p) => p.in === "header")
    .sort((a, b) => (a.required && !b.required ? -1 : 1))
    .map((p) => ({
      name: p.name,
      defaultValue:
        p.schema?.default ?? p.examples?.find((x) => x.value)?.value ?? "",
      exampleValue: getParameterExampleValue(p.schema, p.name),
      defaultActive: p.required ?? false,
      isRequired: p.required ?? false,
      enum: p.schema?.type === "array" ? p.schema?.items?.enum : p.schema?.enum,
      type: p.schema?.type ?? "string",
    }));

  const queryParams = operation.parameters
    ?.filter((p) => p.in === "query")
    .sort((a, b) => (a.required && !b.required ? -1 : 1))
    .map((p) => ({
      name: p.name,
      defaultActive: p.required ?? false,
      isRequired: p.required ?? false,
      enum: p.schema?.type === "array" ? p.schema?.items?.enum : p.schema?.enum,
      type: p.schema?.type ?? "string",
      defaultValue: Array.isArray(p.schema?.default)
        ? JSON.stringify(p.schema.default)
        : p.schema?.default,
      exampleValue: getParameterExampleValue(p.schema, p.name),
      style: p.style ?? undefined,
      explode: p.explode ?? undefined,
      allowReserved: p.allowReserved ?? undefined,
    }));

  const pathParams = operation.parameters
    ?.filter((p) => p.in === "path")
    .map((p) => ({
      name: p.name,
      defaultValue: p.schema?.default,
      exampleValue: getParameterExampleValue(p.schema, p.name),
    }));

  return (
    <PlaygroundDialog
      server={server}
      servers={servers}
      method={operation.method}
      url={operation.path}
      headers={headers}
      queryParams={queryParams}
      pathParams={pathParams}
      examples={examples}
    />
  );
};
