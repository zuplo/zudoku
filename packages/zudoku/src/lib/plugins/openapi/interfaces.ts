type OasSource =
  | { type: "url"; input: string }
  | { type: "file"; input: string };

export type OasPluginConfig = {
  server?: string;
  navigationId?: string;
  skipPreload?: boolean;
} & OasSource;
