type OasSource =
  | { type: "url"; input: string }
  | { type: "file"; input: any }
  | { type: "raw"; input: string };

export type OasPluginConfig = {
  server?: string;
  navigationId?: string;
  skipPreload?: boolean;
} & OasSource;
