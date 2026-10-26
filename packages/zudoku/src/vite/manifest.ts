import { writeFile } from "node:fs/promises";
import path from "node:path";
import type { ZudokuConfig } from "../config/config.js";
import { buildManifest, MANIFEST_FILENAME } from "../lib/manifest.js";

export const writeManifest = async (
  distDir: string,
  config: Pick<ZudokuConfig, "basePath" | "protectedRoutes">,
) => {
  await writeFile(
    path.join(distDir, MANIFEST_FILENAME),
    `${JSON.stringify(buildManifest(config), null, 2)}\n`,
    "utf-8",
  );
};
