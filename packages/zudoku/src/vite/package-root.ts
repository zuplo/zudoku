import path from "node:path";
import { fileExists } from "../config/file-exists.js";

export const findPackageRoot = async (
  startDir: string,
): Promise<string | undefined> => {
  let dir = startDir;
  while (dir !== path.dirname(dir)) {
    if (await fileExists(path.join(dir, "package.json"))) return dir;
    dir = path.dirname(dir);
  }
};
