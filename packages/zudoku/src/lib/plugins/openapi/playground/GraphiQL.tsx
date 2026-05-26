import { createGraphiQLFetcher } from "@graphiql/toolkit";
import { GraphiQL } from "graphiql";
import { useMemo } from "react";
import { useTheme } from "../../../hooks/index.js";
import "graphiql/style.css";
import "./graphiql-theme.css";

export type GraphiQLTab = {
  query: string;
  variables?: string;
  headers?: string;
};

export type GraphiQLPanelProps = {
  endpoint: string;
  defaultHeaders?: string;
  defaultTabs?: GraphiQLTab[];
};

export const GraphiQLPanel = ({
  endpoint,
  defaultHeaders,
  defaultTabs,
}: GraphiQLPanelProps) => {
  const fetcher = useMemo(
    () => createGraphiQLFetcher({ url: endpoint }),
    [endpoint],
  );

  const { resolvedTheme } = useTheme();
  const forcedTheme = resolvedTheme === "dark" ? "dark" : "light";

  return (
    <div className="h-full w-full graphiql-container">
      <GraphiQL
        fetcher={fetcher}
        defaultHeaders={defaultHeaders}
        defaultTabs={defaultTabs}
        forcedTheme={forcedTheme}
      >
        <GraphiQL.Logo>GraphQL Playground</GraphiQL.Logo>
      </GraphiQL>
    </div>
  );
};

export default GraphiQLPanel;
