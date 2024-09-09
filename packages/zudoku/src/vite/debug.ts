import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export async function writePluginDebugCode(
  rootDir: string,
  pluginName: string,
  code: string | string[],
  extension: string = "js",
) {
  if (process.env.ZUDOKU_BUILD_DEBUG) {
    const debugDir = path.join(rootDir, "dist", "debug");
    await mkdir(debugDir, { recursive: true });
    await writeFile(
      path.join(debugDir, `${pluginName}.${extension}`),
      typeof code === "string" ? code : code.join("\n"),
    );
  }
}
