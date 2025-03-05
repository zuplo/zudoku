import { glob } from "glob";
import fs from "node:fs/promises";
import path from "node:path";
import colors from "picocolors";
import { runBuild } from "../../vite/build.js";
import { loadZudokuConfig } from "../../vite/config.js";
import { createPagefindIndex } from "../../vite/create-pagefind-index.js";
import { writeLine } from "../../vite/reporter.js";
import { logger } from "../common/logger.js";

const captureOutput = async <T>(fn: () => Promise<T>): Promise<T> => {
  const stdout = process.stdout.write;
  const stderr = process.stderr.write;
  process.stdout.write = () => true;
  process.stderr.write = () => true;
  try {
    return await fn();
  } finally {
    process.stdout.write = stdout;
    process.stderr.write = stderr;
  }
};

export const pagefindCommand = async (argv: { forceBuild: boolean }) => {
  const dir = process.cwd();
  const dist = path.join(dir, "dist");

  const { config } = await loadZudokuConfig(
    { mode: "production", command: "build" },
    dir,
  );

  if (config.search?.type !== "pagefind") {
    logger.warn(colors.yellow("Search is not configured to use pagefind."));
  }

  const message = argv.forceBuild
    ? "creating build and pagefind index..."
    : "building pagefind index...";
  writeLine(colors.blue(message));

  if (argv.forceBuild) {
    await captureOutput(() => runBuild({ dir }));
  }

  const outputPath = await createPagefindIndex({
    dir: dist,
    outDir: path.join(process.cwd(), "public"),
  });

  const successMessage = argv.forceBuild
    ? `✓ build created and pagefind index written to ${outputPath}`
    : `✓ pagefind index written to ${outputPath}`;

  writeLine(colors.blue(successMessage));

  // find pagefind directory in dist with glob
  const pagefindGlob = await glob("**/pagefind/", {
    cwd: dist,
    absolute: true,
  });
  const pagefindDir = pagefindGlob.at(0);

  if (!pagefindDir) {
    throw new Error(`pagefind directory not found in ${dist}.`);
  }

  // move from dist to public dir so it can be consumed in dev
  const publicDir = path.join(dir, "public/pagefind");

  await fs.rm(publicDir, { recursive: true, force: true });
  await fs.rename(pagefindDir, publicDir);
};
