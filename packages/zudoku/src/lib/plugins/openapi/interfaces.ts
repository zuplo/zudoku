type OasSource =
  | { type: "url"; input: string }
  | { type: "yaml"; input: string }
  | { type: "json"; input: object };

export type OasPluginConfig = {
  server?: string;
  navigationId?: string;
  skipPreload?: boolean;
} & OasSource;
