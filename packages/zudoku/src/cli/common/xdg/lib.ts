import { homedir } from "node:os";
import path from "node:path";
import { CLI_XDG_FOLDER_NAME } from "../constants.js";

function defineDirectoryWithFallback(xdgName: string, fallback: string) {
  if (process.env[xdgName]) {
    return process.env[xdgName] as string;
  } else {
    return path.join(homedir(), fallback);
  }
}

export const XDG_CONFIG_HOME = defineDirectoryWithFallback(
  "XDG_CONFIG_HOME",
  ".config",
);
export const XDG_DATA_HOME = defineDirectoryWithFallback(
  "XDG_DATA_HOME",
  ".local/share",
);
export const XDG_STATE_HOME = defineDirectoryWithFallback(
  "XDG_DATA_HOME",
  ".local/state",
);
export const ZUDOKU_XDG_CONFIG_HOME = path.join(
  XDG_CONFIG_HOME,
  CLI_XDG_FOLDER_NAME,
);
export const ZUDOKU_XDG_DATA_HOME = path.join(
  XDG_DATA_HOME,
  CLI_XDG_FOLDER_NAME,
);
export const ZUDOKU_XDG_STATE_HOME = path.join(
  XDG_STATE_HOME,
  CLI_XDG_FOLDER_NAME,
);
