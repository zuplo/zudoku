type OasSource = { type: "url"; input: string } | { type: "file"; input: any };

export type OasPluginConfig = {
  server?: string;
  navigationId?: string;
  skipPreload?: boolean;
} & OasSource;
