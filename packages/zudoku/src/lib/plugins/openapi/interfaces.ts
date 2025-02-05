type DynamicInput = () => Promise<unknown>;

type OasSource =
  | { type: "url"; input: string }
  | { type: "file"; input: { [version: string]: DynamicInput } }
  | { type: "raw"; input: string };

export type ContextOasSource =
  | { type: "url"; input: string }
  | { type: "file"; input: DynamicInput }
  | { type: "raw"; input: string };

export type OasPluginConfig = {
  server?: string;
  navigationId?: string;
  skipPreload?: boolean;
  tagPages?: Array<string>;
  loadTags?: boolean;
} & OasPluginConfigOptions &
  OasSource;

export type OasPluginConfigOptions = {
  options?: {
    examplesDefaultLanguage?: string;
  };
};

export type OasPluginContext = {
  server?: string;
  navigationId?: string;
  skipPreload?: boolean;
  version?: string;
  versions: Record<string, string>;
} & ContextOasSource &
  OasPluginConfigOptions;
