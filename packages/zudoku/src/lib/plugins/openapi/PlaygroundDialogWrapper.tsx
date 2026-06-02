import { useOasConfig } from "./context.js";
import type {
  MediaTypeObject,
  OperationsFragmentFragment,
} from "./graphql/graphql.js";
import { PlaygroundDialog } from "./playground/PlaygroundDialog.js";
import { extractOperationSecuritySchemes } from "./util/extractOperationSecuritySchemes.js";
import {
  type PrefillMode,
  resolveParamValue,
  stringifyParamValue,
} from "./util/resolveParamValue.js";

export const PlaygroundDialogWrapper = ({
  server,
  servers,
  operation,
  examples,
  prefillWith = "default",
}: {
  server?: string;
  servers?: string[];
  operation: OperationsFragmentFragment;
  examples?: MediaTypeObject[];
  prefillWith?: PrefillMode;
}) => {
  const headers = operation.parameters
    ?.filter((p) => p.in === "header")
    .sort((a, b) => Number(b.required ?? false) - Number(a.required ?? false))
    .map((p) => {
      const raw = resolveParamValue(p, prefillWith);
      return {
        name: p.name,
        defaultValue: stringifyParamValue(raw) ?? "",
        defaultActive: p.required ?? false,
        isRequired: p.required ?? false,
        enum:
          p.schema?.type === "array" ? p.schema?.items?.enum : p.schema?.enum,
        type: p.schema?.type ?? "string",
      };
    });

  const queryParams = operation.parameters
    ?.filter((p) => p.in === "query")
    .sort((a, b) => Number(b.required ?? false) - Number(a.required ?? false))
    .map((p) => {
      const raw = resolveParamValue(p, prefillWith);
      return {
        name: p.name,
        defaultActive: p.required ?? false,
        isRequired: p.required ?? false,
        enum:
          p.schema?.type === "array" ? p.schema?.items?.enum : p.schema?.enum,
        type: p.schema?.type ?? "string",
        defaultValue: stringifyParamValue(raw),
        style: p.style ?? undefined,
        explode: p.explode ?? undefined,
        allowReserved: p.allowReserved ?? undefined,
      };
    });

  const pathParams = operation.parameters
    ?.filter((p) => p.in === "path")
    .map((p) => {
      const raw = resolveParamValue(p, prefillWith);
      return {
        name: p.name,
        defaultValue: stringifyParamValue(raw),
      };
    });

  const { options } = useOasConfig();

  const securitySchemes = options?.disableSecurity
    ? []
    : extractOperationSecuritySchemes(operation);

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
    />
  );
};
