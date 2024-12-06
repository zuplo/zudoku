type OasSource =
  | { type: "url"; input: string }
  | { type: "file"; input: () => Promise<unknown> }
  | { type: "raw"; input: string };

export type OasPluginConfig = {
  server?: string;
  navigationId?: string;
  skipPreload?: boolean;
} & OasSource;
