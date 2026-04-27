import { useOasConfig } from "./context.js";
import type {
  MediaTypeObject,
  OperationsFragmentFragment,
} from "./graphql/graphql.js";
import { PlaygroundDialog } from "./playground/PlaygroundDialog.js";
import { extractOperationSecuritySchemes } from "./util/extractOperationSecuritySchemes.js";

const extractRefName = (ref: unknown): string | undefined => {
  if (typeof ref !== "string") return undefined;
  return ref.split("/").pop();
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
      style: p.style ?? undefined,
      explode: p.explode ?? undefined,
      allowReserved: p.allowReserved ?? undefined,
    }));

  const pathParams = operation.parameters
    ?.filter((p) => p.in === "path")
    .map((p) => ({
      name: p.name,
      defaultValue: p.schema?.default,
    }));

  const { options } = useOasConfig();

  const securitySchemes = options?.disableSecurity
    ? []
    : extractOperationSecuritySchemes(operation);

  const responseSchemas = Object.fromEntries(
    operation.responses.flatMap((response) => {
      const schema = response.content?.find((c) =>
        c.mediaType.includes("json"),
      )?.schema;

      const name =
        schema?.title ??
        extractRefName(schema?.__$ref) ??
        extractRefName(schema?.$ref);

      if (name) {
        return [[response.statusCode, name]];
      }
      return [];
    }),
  );

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
      security={
        !options?.disableSecurity
          ? (operation.security ?? undefined)
          : undefined
      }
      securitySchemes={securitySchemes}
      responseSchemas={responseSchemas}
    />
  );
};
