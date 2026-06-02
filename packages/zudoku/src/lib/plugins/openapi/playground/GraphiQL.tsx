import { GraphiQLViewer, type GraphiQLTab } from "../../../graphiql/index.js";

export type { GraphiQLTab };

export type GraphiQLPanelProps = {
  endpoint: string;
  defaultHeaders?: string;
  defaultTabs?: GraphiQLTab[];
};

export const GraphiQLPanel = ({
  endpoint,
  defaultHeaders,
  defaultTabs,
}: GraphiQLPanelProps) => (
  <GraphiQLViewer
    endpoint={endpoint}
    defaultHeaders={defaultHeaders}
    defaultTabs={defaultTabs}
    className="h-full w-full"
  />
);

export default GraphiQLPanel;
