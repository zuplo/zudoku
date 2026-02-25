export type CodeTabPanelProps = {
  language?: string;
  icon?: string;
  title?: string;
  code: string;
  meta?: string;
};

// This component never renders. It serves as a typed data container whose props
// are extracted by CodeTabs to build tab panels. Used in MDX via the
// remark-code-tabs plugin which converts fenced code blocks into CodeTabPanel elements.
export const CodeTabPanel = (_props: CodeTabPanelProps) => null;
CodeTabPanel.displayName = "CodeTabPanel";
