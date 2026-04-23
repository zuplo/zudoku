import { writeFile } from "node:fs/promises";
import path from "node:path";
import colors from "picocolors";
import { joinUrl } from "../lib/util/joinUrl.js";
import type { MarkdownFileInfo } from "./plugin-markdown-export.js";
export async function generateLlmsTxtFiles({
  markdownFileInfos,
  outputUrls,
  baseOutputDir,
  basePath,
  siteName,
  llmsTxt,
  llmsTxtFull,
  redirectUrls,
}: {
  markdownFileInfos: MarkdownFileInfo[];
  basePath: string | undefined;
  outputUrls: string[];
  baseOutputDir: string;
  siteName?: string;
  llmsTxt?: boolean;
  llmsTxtFull?: boolean;
  redirectUrls: Set<string>;
}) {
  const nonRedirectUrls = outputUrls.filter((url) => !redirectUrls.has(url));

  const baseUrl = basePath ?? "";
  const title = siteName ?? "Documentation";

  const markdownMap = new Map(
    markdownFileInfos.map((info) => [info.routePath, info]),
  );

  // Generate llms.txt
  if (llmsTxt) {
    const llmsTxtParts: string[] = [];

    llmsTxtParts.push(`# ${title}\n`);
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
  if (llmsTxtFull) {
    const llmsFullParts: string[] = [];

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
