import type { PackageManager } from "../helpers/get-pkg-manager";

export type TemplateType = "default" | "zuplo";
export type TemplateMode = "js" | "ts";

export interface GetTemplateFileArgs {
  template: TemplateType;
  mode: TemplateMode;
  file: string;
}

export interface InstallTemplateArgs {
  appName: string;
  root: string;
  packageManager: PackageManager;
  isOnline: boolean;
  template: TemplateType;
  mode: TemplateMode;
  eslint: boolean;
  skipInstall: boolean;
  zudokuVersion: string;
}
