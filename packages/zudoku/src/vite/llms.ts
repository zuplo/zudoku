import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import colors from "picocolors";
import type { ZudokuLlmsConfig } from "../config/validators/validate.js";
import { joinUrl } from "../lib/util/joinUrl.js";
import type { WorkerResult } from "./prerender/prerender.js";

type MarkdownFileInfo = {
  filePath: string;
  routePath: string;
  title?: string;
  description?: string;
  content: string;
};

export async function generateLlmsTxtFiles({
  outputUrls,
  basePath,
  baseOutputDir,
  siteName,
  llmsConfig,
  workerResults,
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
   * The site name for the header
   */
  siteName?: string;
  /**
   * The llms configuration
   */
  llmsConfig: ZudokuLlmsConfig;
  /**
   * The worker results from prerendering (used to filter redirects)
   */
  workerResults: WorkerResult[];
}) {
  // Filter out redirect pages from outputUrls
  const redirectUrls = new Set(
    workerResults
      .filter((result) => result.redirect)
      .map((result) => {
        const redirect = result.redirect;
        if (!redirect) return "";
        return redirect.from.replace(basePath ?? "", "");
      }),
  );
  const nonRedirectUrls = outputUrls.filter((url) => !redirectUrls.has(url));

  // Read markdown info file if it exists
  const markdownInfoPath = path.join(baseOutputDir, ".markdown-info.json");
  let markdownFileInfos: MarkdownFileInfo[] = [];

  try {
    const markdownInfoContent = await readFile(markdownInfoPath, "utf-8");
    const parsed = JSON.parse(markdownInfoContent);
    markdownFileInfos = parsed.markdownFileInfos || [];
  } catch {
    // No markdown info file, skip
    return;
  }

  const baseUrl = basePath ?? "";
  const title = siteName ?? "Documentation";

  // Create a map of route paths to markdown info
  const markdownMap = new Map(
    markdownFileInfos.map((info) => [info.routePath, info]),
  );

  // Generate llms.txt (summary with links)
  if (llmsConfig.llmsTxt !== false) {
    const llmsTxtParts: string[] = [];

    // Header with site name
    llmsTxtParts.push(`# ${title}\n`);

    // Add a brief summary
    llmsTxtParts.push("> Documentation files for Large Language Models\n");

    // Add documentation section with links to all pages (matching sitemap structure)
    llmsTxtParts.push("## Documentation\n");

    for (const url of nonRedirectUrls) {
      // Skip error pages
      if (/(400|404|500)$/.test(url)) continue;

      const mdInfo = markdownMap.get(url);

      // Only include pages that have markdown content
      if (mdInfo) {
        // If we have markdown for this page, link to the .md file
        const mdUrl = joinUrl(baseUrl, `${url}.md`);
        const linkTitle = mdInfo.title ?? url;
        const description = mdInfo.description ? `: ${mdInfo.description}` : "";
        llmsTxtParts.push(`- [${linkTitle}](${mdUrl})${description}`);
      }
    }

    const llmsTxt = llmsTxtParts.join("\n");
    await writeFile(path.join(baseOutputDir, "llms.txt"), llmsTxt, "utf-8");

    // biome-ignore lint/suspicious/noConsole: Logging allowed here
    console.log(colors.blue("✓ generated llms.txt"));
  }

  // Generate llms-full.txt (full content of all markdown documents)
  if (llmsConfig.llmsTxtFull !== false) {
    const llmsFullParts: string[] = [];

    // Header with site name
    llmsFullParts.push(`# ${title}\n`);
    llmsFullParts.push("> Complete documentation for Large Language Models\n");

    // Add each markdown document's full content
    for (const info of markdownFileInfos) {
      llmsFullParts.push(`\n---\n`);
      llmsFullParts.push(`## Document: ${info.title ?? info.routePath}\n`);
      if (info.description) {
        llmsFullParts.push(`${info.description}\n`);
      }
      llmsFullParts.push(`URL: ${joinUrl(baseUrl, info.routePath)}\n`);
      llmsFullParts.push(`\n${info.content}\n`);
    }

    const llmsFull = llmsFullParts.join("\n");
    await writeFile(
      path.join(baseOutputDir, "llms-full.txt"),
      llmsFull,
      "utf-8",
    );

    // biome-ignore lint/suspicious/noConsole: Allowed here
    console.log(colors.blue("✓ generated llms-full.txt"));
  }
}
