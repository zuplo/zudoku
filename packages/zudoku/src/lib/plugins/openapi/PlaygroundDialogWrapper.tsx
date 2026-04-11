import type {
  MediaTypeObject,
  OperationsFragmentFragment,
} from "./graphql/graphql.js";
import { PlaygroundDialog } from "./playground/PlaygroundDialog.js";
import {
  type PrefillMode,
  resolveParamValue,
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
    .sort((a, b) => (a.required && !b.required ? -1 : 1))
    .map((p) => {
      const raw = resolveParamValue(p, prefillWith);
      return {
        name: p.name,
        defaultValue: raw != null ? String(raw) : "",
        defaultActive: p.required ?? false,
        isRequired: p.required ?? false,
        enum:
          p.schema?.type === "array" ? p.schema?.items?.enum : p.schema?.enum,
        type: p.schema?.type ?? "string",
      };
    });

  const queryParams = operation.parameters
    ?.filter((p) => p.in === "query")
    .sort((a, b) => (a.required && !b.required ? -1 : 1))
    .map((p) => {
      const raw = resolveParamValue(p, prefillWith);
      return {
        name: p.name,
        defaultActive: p.required ?? false,
        isRequired: p.required ?? false,
        enum:
          p.schema?.type === "array" ? p.schema?.items?.enum : p.schema?.enum,
        type: p.schema?.type ?? "string",
        defaultValue: Array.isArray(raw)
          ? JSON.stringify(raw)
          : raw != null
            ? String(raw)
            : undefined,
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
        defaultValue: raw != null ? String(raw) : undefined,
      };
    });

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
