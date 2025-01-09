type OasSource =
  | { type: "url"; input: string }
  | {
      type: "file";
      input: {
        [version: string]: () => Promise<unknown>;
      };
    }
  | { type: "raw"; input: string };

export type ContextOasSource =
  | { type: "url"; input: string }
  | {
      type: "file";
      input: () => Promise<unknown>;
    }
  | { type: "raw"; input: string };

export type OasPluginConfig = {
  server?: string;
  navigationId?: string;
  skipPreload?: boolean;
} & OasSource;

export type OasPluginContext = {
  server?: string;
  navigationId?: string;
  skipPreload?: boolean;
  version?: string;
  versions: Record<string, string>;
} & ContextOasSource;
