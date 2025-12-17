import "./setupGraphiQLWorkers.js";
import { createGraphiQLFetcher } from "@graphiql/toolkit";
import { GraphiQL, type GraphiQLProps } from "graphiql";
import { type ReactNode, useMemo } from "react";
import { useTheme } from "../hooks/index.js";
import { cn } from "../util/cn.js";
import "graphiql/style.css";
import "./graphiql-theme.css";

export type GraphiQLTab = {
  query: string;
  variables?: string;
  headers?: string;
};

export type GraphiQLFetcher = NonNullable<GraphiQLProps["fetcher"]>;

export type GraphiQLViewerProps = {
  endpoint?: string;
  fetcher?: GraphiQLFetcher;
  schema?: unknown;
  headers?: Record<string, string>;
  defaultHeaders?: string;
  defaultTabs?: GraphiQLTab[];
  initialQuery?: string;
  initialVariables?: string;
  initialHeaders?: string;
  onEditQuery?: (query: string) => void;
  onEditVariables?: (variables: string) => void;
  onEditHeaders?: (headers: string) => void;
  hideToolbarButtons?: boolean;
  shouldPersistHeaders?: boolean;
  resetKey?: string | number;
  logo?: ReactNode;
  className?: string;
};

const HIDE_TOOLBAR_STYLE = `
  .zudoku-graphiql [aria-label^="Re-fetch GraphQL schema"],
  .zudoku-graphiql [aria-label="Open short keys dialog"],
  .zudoku-graphiql [aria-label="Open settings dialog"] {
    display: none !important;
  }
`;

export const GraphiQLViewer = ({
  endpoint,
  fetcher: fetcherProp,
  schema,
  headers,
  defaultHeaders,
  defaultTabs,
  initialQuery,
  initialVariables,
  initialHeaders,
  onEditQuery,
  onEditVariables,
  onEditHeaders,
  hideToolbarButtons,
  shouldPersistHeaders,
  resetKey,
  logo,
  className,
}: GraphiQLViewerProps) => {
  const { resolvedTheme } = useTheme();
  const forcedTheme = resolvedTheme === "dark" ? "dark" : "light";

  const fetcher = useMemo<GraphiQLFetcher>(() => {
    if (fetcherProp) return fetcherProp;
    if (!endpoint) {
      const offline: GraphiQLFetcher = async (params) => {
        if (
          schema &&
          (params.operationName === "IntrospectionQuery" ||
            params.query.includes("__schema"))
        ) {
          return { data: schema } as never;
        }
        return {
          errors: [
            { message: "No GraphQL endpoint configured for this playground." },
          ],
        } as never;
      };
      return offline;
    }
    return createGraphiQLFetcher({
      url: endpoint,
      headers: headers as Record<string, string> | undefined,
    });
  }, [fetcherProp, endpoint, headers, schema]);

  return (
    <div className={cn("zudoku-graphiql graphiql-container", className)}>
      {hideToolbarButtons && <style>{HIDE_TOOLBAR_STYLE}</style>}
      <GraphiQL
        key={resetKey ?? "default"}
        fetcher={fetcher}
        schema={schema as GraphiQLProps["schema"]}
        defaultHeaders={defaultHeaders}
        defaultTabs={defaultTabs}
        initialQuery={initialQuery}
        defaultQuery={initialQuery}
        initialVariables={initialVariables}
        initialHeaders={initialHeaders}
        onEditQuery={onEditQuery}
        onEditVariables={onEditVariables}
        onEditHeaders={onEditHeaders}
        forcedTheme={forcedTheme}
        shouldPersistHeaders={shouldPersistHeaders}
      >
        <GraphiQL.Logo>{logo ?? "GraphQL Playground"}</GraphiQL.Logo>
      </GraphiQL>
    </div>
  );
};

export default GraphiQLViewer;
