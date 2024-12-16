import { createWriteStream, existsSync } from "fs";
import { mkdir } from "fs/promises";
import path from "path";
import { SitemapStream } from "sitemap";
import { ZudokuSiteMapConfig } from "../config/validators/common.js";
import { joinPath } from "../lib/util/joinPath.js";

export async function generateSitemap({
  outputUrls,
  basePath,
  baseOutputDir,
  config,
}: {
  /**
   * The base path of the site (e.g. `/docs`).
   */
  basePath: string | undefined;
  /**
   * The URLs of generated pages
   */
  outputUrls: string[];
  /**
   * The base output directory
   */
  baseOutputDir: string;
  /**
   * The site map configuration
   */
  config: ZudokuSiteMapConfig;
}) {
  if (!config) {
    return;
  }

  const sitemap = new SitemapStream({ hostname: config.siteUrl });

  const outputDir = path.resolve(baseOutputDir, config.outDir ?? "");

  // Ensure the output directory exists
  if (!existsSync(outputDir) === false) {
    await mkdir(outputDir, { recursive: true });
  }

  const sitemapOutputPath = path.join(outputDir, "sitemap.xml");

  const writeStream = createWriteStream(sitemapOutputPath);
  sitemap.pipe(writeStream);

  let lastmod: string | undefined;
  if (config.autoLastmod !== false) {
    lastmod = new Date().toISOString();
  }

  const exclude =
    (typeof config.exclude === "function"
      ? await config.exclude()
      : config.exclude) ?? [];

  for (const url of outputUrls) {
    if (!exclude.includes(url) && !url.includes("*")) {
      sitemap.write({
        url: new URL(joinPath(basePath, url), config.siteUrl).toString(),
        lastmod,
        changefreq: config.changefreq ?? "daily",
        priority: config.priority ?? 0.7,
      });
    }
  }

  sitemap.end();

  // eslint-disable-next-line no-console
  console.debug(`Wrote sitemap to ${sitemapOutputPath}`);
}
