import { createGraphiQLFetcher } from "@graphiql/toolkit";
import { GraphiQL } from "graphiql";
import { useMemo } from "react";
import { useTheme } from "../../../hooks/index.js";
import "graphiql/style.css";
import "./graphiql-theme.css";

export type GraphiQLPanelProps = {
  endpoint: string;
  defaultQuery?: string;
  defaultHeaders?: string;
};

export const GraphiQLPanel = ({
  endpoint,
  defaultQuery,
  defaultHeaders,
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
        defaultQuery={defaultQuery}
        defaultHeaders={defaultHeaders}
        forcedTheme={forcedTheme}
      />
    </div>
  );
};

export default GraphiQLPanel;
