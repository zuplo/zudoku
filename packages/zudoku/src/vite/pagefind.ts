import path from "node:path";
import colors from "picocolors";
import { logger } from "../cli/common/logger.js";
import invariant from "../lib/util/invariant.js";

export const runPagefind = async (options: {
  dir: string;
  outDir?: string;
}) => {
  const pagefind = await import("pagefind");
  const { index, errors } = await pagefind.createIndex();

  invariant(index, `Failed to create pagefind index: ${errors.join(", ")}`);

  await index.addDirectory({ path: options.dir });
  await index.writeFiles({
    outputPath: path.join(options.outDir ?? options.dir, "pagefind"),
  });

  logger.info(colors.blue(`✓ pagefind search index written`));
};
