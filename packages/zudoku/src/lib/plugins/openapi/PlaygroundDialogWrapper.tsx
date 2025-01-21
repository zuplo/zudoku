import type { OperationListItemResult } from "./OperationList.js";
import { PlaygroundDialog } from "./playground/PlaygroundDialog.js";

export const PlaygroundDialogWrapper = ({
  server,
  servers,
  operation,
}: {
  server: string;
  servers?: string[];
  operation: OperationListItemResult;
}) => {
  const headers = operation.parameters
    ?.filter((p) => p.in === "header")
    .map((p) => ({
      name: p.name,
      defaultValue: p.examples?.find((x) => x.value)?.value ?? "",
      defaultActive: false,
    }));
  const queryParams = operation.parameters
    ?.filter((p) => p.in === "query")
    .sort((a, b) => (a.required && !b.required ? -1 : 1))
    .map((p) => ({
      name: p.name,
      defaultActive: p.required ?? false,
      isRequired: p.required ?? false,
      enum: p.schema?.type == "array" ? p.schema?.items?.enum : p.schema?.enum,
      type: p.schema?.type ?? "string",
    }));
  const pathParams = operation.parameters
    ?.filter((p) => p.in === "path")
    .map((p) => ({ name: p.name }));

  return (
    <PlaygroundDialog
      server={server}
      servers={servers}
      method={operation.method}
      url={operation.path}
      headers={headers}
      queryParams={queryParams}
      pathParams={pathParams}
    />
  );
};
