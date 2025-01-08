type OasSource =
  | { type: "url"; input: string }
  | {
      type: "file";
      input: {
        [version: string]: () => Promise<unknown>;
      };
    }
  | { type: "raw"; input: string };

export type ResolvedOasSource =
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

export type ResolvedOasPluginConfig = {
  server?: string;
  navigationId?: string;
  skipPreload?: boolean;
} & ResolvedOasSource;
