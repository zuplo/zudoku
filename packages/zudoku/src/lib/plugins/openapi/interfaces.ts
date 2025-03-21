type DynamicInput = () => Promise<unknown>;

type OasSource =
  | { type: "url"; input: string }
  | { type: "file"; input: { [version: string]: DynamicInput } }
  | { type: "raw"; input: string };

export type ContextOasSource =
  | { type: "url"; input: string }
  | { type: "file"; input: DynamicInput }
  | { type: "raw"; input: string };

type BaseOasConfig = {
  server?: string;
  navigationId?: string;
  skipPreload?: boolean;
  tagPages?: Array<string>;
  options?: {
    examplesLanguage?: string;
    disablePlayground?: boolean;
    loadTags?: boolean;
    showVersionSelect?: "always" | "if-available" | "hide";
  };
};

export type OasPluginConfig = BaseOasConfig & OasSource;

export type OasPluginContext = BaseOasConfig &
  ContextOasSource & {
    version?: string;
    versions: Record<string, string>;
  };
