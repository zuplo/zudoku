import { useMemo } from "react";
import { cn } from "zudoku";
import { GraphiQLViewer, type GraphiQLFetcher } from "zudoku/graphiql";
import { useApiIdentitySelection } from "zudoku/hooks";

const EMPTY_HEADERS: Record<string, string> = {};

export type GraphQLPlaygroundOperation = {
  id: number;
  query: string;
  variables?: string;
  headers?: string;
};

type GraphQLPlaygroundProps = {
  endpoint?: string;
  headers?: Record<string, string>;
  schema?: unknown;
  query?: string;
  variables?: string;
  operation?: GraphQLPlaygroundOperation;
  onOperationChange?: (
    operation: Partial<Omit<GraphQLPlaygroundOperation, "id">>,
  ) => void;
  className?: string;
};

export const GraphQLPlayground = ({
  endpoint,
  headers = EMPTY_HEADERS,
  schema,
  query,
  variables,
  operation,
  onOperationChange,
  className,
}: GraphQLPlaygroundProps) => {
  const initialQuery = operation?.query ?? query;
  const initialVariables = operation?.variables ?? variables;
  const initialHeaders =
    operation?.headers ??
    (Object.keys(headers).length > 0
      ? JSON.stringify(headers, null, 2)
      : undefined);

  const { authorizeRequest, selectedIdentity } = useApiIdentitySelection();

  const fetcher = useMemo<GraphiQLFetcher>(
    () => async (graphQLParams, opts) => {
      // Serve build-time schema for introspection to avoid hitting live endpoint.
      if (
        graphQLParams.operationName === "IntrospectionQuery" ||
        graphQLParams.query?.includes("__schema")
      ) {
        return { data: schema };
      }

      if (!endpoint) {
        return {
          errors: [
            {
              message:
                "Configure the plugin's endpoint to run GraphQL operations.",
            },
          ],
        };
      }

      const request = new Request(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
          ...(opts?.headers as Record<string, string> | undefined),
        },
        body: JSON.stringify(graphQLParams),
      });

      const response = await fetch(await authorizeRequest(request));
      return response.json();
    },
    [endpoint, headers, schema, authorizeRequest],
  );

  return (
    <GraphiQLViewer
      fetcher={fetcher}
      footerNote={
        selectedIdentity
          ? `Authorized as “${selectedIdentity.label}”. Auth is applied automatically when the request is sent.`
          : undefined
      }
      schema={schema}
      initialQuery={initialQuery}
      initialVariables={initialVariables}
      initialHeaders={initialHeaders}
      onEditQuery={(query) => onOperationChange?.({ query })}
      onEditVariables={(variables) => onOperationChange?.({ variables })}
      onEditHeaders={(headers) => onOperationChange?.({ headers })}
      shouldPersistHeaders
      hideToolbarButtons
      resetKey={operation?.id ?? "empty"}
      className={cn(
        "h-full border rounded-lg overflow-hidden bg-background font-sans text-foreground",
        className,
      )}
    />
  );
};
