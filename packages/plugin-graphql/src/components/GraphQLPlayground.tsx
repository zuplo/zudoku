import { useMemo } from "react";
import { cn } from "zudoku";
import { GraphiQLViewer, type GraphiQLFetcher } from "zudoku/graphiql";

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

  const fetcher = useMemo<GraphiQLFetcher>(
    () => async (graphQLParams, opts) => {
      if (!endpoint) {
        if (
          graphQLParams.operationName === "IntrospectionQuery" ||
          graphQLParams.query.includes("__schema")
        ) {
          return { data: schema };
        }
        return {
          errors: [
            {
              message:
                "Configure options.playground.endpoint to run GraphQL operations.",
            },
          ],
        };
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
          ...(opts?.headers as Record<string, string> | undefined),
        },
        body: JSON.stringify(graphQLParams),
      });

      return response.json();
    },
    [endpoint, headers, schema],
  );

  return (
    <GraphiQLViewer
      fetcher={fetcher}
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
      logo={<span className="text-sm font-semibold">GraphQL Playground</span>}
      className={cn(
        "h-full border rounded-lg overflow-hidden bg-background font-sans text-foreground",
        className,
      )}
    />
  );
};
