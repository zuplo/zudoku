import { PlaygroundDialog, PlaygroundProvider } from "@zudoku/playground";
import { useAuth } from "../../authentication/hook.js";
import { useApiIdentities } from "../../components/context/ZudokuContext.js";
import { SyntaxHighlight } from "../../ui/SyntaxHighlight.js";
import type {
  MediaTypeObject,
  OperationsFragmentFragment,
} from "./graphql/graphql.js";

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
  const identities = useApiIdentities();
  const { isAuthEnabled, login, signup, isPending, isAuthenticated } =
    useAuth();

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

  return (
    <PlaygroundProvider
      renderCodeBlock={(props) => (
        <SyntaxHighlight
          className={props.className}
          embedded={props.embedded}
          fullHeight={props.fullHeight}
          language={props.language}
          code={props.code}
        />
      )}
    >
      <PlaygroundDialog
        server={server}
        servers={servers}
        method={operation.method}
        url={operation.path}
        headers={headers}
        queryParams={queryParams}
        pathParams={pathParams}
        examples={examples}
        identities={identities.data ?? []}
        requiresLogin={isAuthEnabled && !isAuthenticated && !isPending}
        onLogin={() => login()}
        onSignUp={() => signup()}
      />
    </PlaygroundProvider>
  );
};
