import path from "node:path";
import invariant from "../lib/util/invariant.js";

export const createPagefindIndex = async (options: {
  dir: string;
  outDir?: string;
}) => {
  const pagefind = await import("pagefind");
  const { index, errors } = await pagefind.createIndex();

  invariant(index, `Failed to create pagefind index: ${errors.join(", ")}`);

  const outputPath = path.join(options.outDir ?? options.dir, "pagefind");

  await index.addDirectory({ path: options.dir });
  await index.writeFiles({ outputPath });

  return outputPath;
};
