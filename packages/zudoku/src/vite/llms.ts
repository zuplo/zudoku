import { writeFile } from "node:fs/promises";
import path from "node:path";
import colors from "picocolors";
import type { LlmsSection } from "../lib/core/plugins.js";
import { joinUrl } from "../lib/util/joinUrl.js";
import {
  encodeDocumentationRoutePath,
  getMarkdownRepresentationPath,
} from "../lib/util/markdown-representation.js";
import type { MarkdownFileInfo } from "./plugin-markdown-export.js";

const DEFAULT_TITLE = "Documentation";
const DEFAULT_DESCRIPTION = "Documentation files for Large Language Models";

const toSingleLine = (value: string): string =>
  value.replaceAll(/\s+/g, " ").trim();

const escapeMarkdownLinkLabel = (value: string): string =>
  toSingleLine(value).replaceAll(/([\\[\]])/g, "\\$1");

// llms.txt introductory details may contain Markdown, but the specification
// reserves headings for link-list sections. Escape heading syntax so authored
// guidance cannot accidentally create a prose-only H2 section.
const formatInstructions = (value: string): string =>
  value
    .trim()
    .replaceAll("\r\n", "\n")
    .split("\n")
    .map((line) =>
      line
        .replace(/^( {0,3})(#{1,6})(?=\s|$)/, "$1\\$2")
        .replace(/^( {0,3})([=-]{2,})\s*$/, "$1\\$2"),
    )
    .join("\n");

export async function generateLlmsTxtFiles({
  markdownFileInfos,
  outputUrls,
  baseOutputDir,
  basePath,
  siteName,
  llmsTxt,
  llmsTxtFull,
  title: configuredTitle,
  description: configuredDescription,
  instructions,
  sections = [],
  redirectUrls,
}: {
  markdownFileInfos: MarkdownFileInfo[];
  basePath: string | undefined;
  outputUrls: string[];
  baseOutputDir: string;
  siteName?: string;
  llmsTxt?: boolean;
  llmsTxtFull?: boolean;
  title?: string;
  description?: string;
  instructions?: string;
  sections?: LlmsSection[];
  redirectUrls: Set<string>;
}) {
  const nonRedirectUrls = outputUrls.filter((url) => !redirectUrls.has(url));

  const baseUrl = basePath ?? "";
  const title = toSingleLine(configuredTitle ?? siteName ?? DEFAULT_TITLE);
  const description = toSingleLine(
    configuredDescription ?? DEFAULT_DESCRIPTION,
  );
  const formattedInstructions = instructions
    ? formatInstructions(instructions)
    : undefined;

  const markdownMap = new Map(
    markdownFileInfos.map((info) => [info.routePath, info]),
  );

  // Generate llms.txt
  if (llmsTxt) {
    const documentationLinks: string[] = [];

    for (const url of nonRedirectUrls) {
      // Skip error pages
      if (/(400|404|500)$/.test(url)) continue;

      const mdInfo = markdownMap.get(url);

      // Only include pages that have markdown content
      if (mdInfo) {
        // If we have markdown for this page, link to the .md file
        const mdUrl = getMarkdownRepresentationPath(url, basePath);
        const linkTitle = escapeMarkdownLinkLabel(mdInfo.title ?? url);
        const linkDescription = mdInfo.description
          ? `: ${toSingleLine(mdInfo.description)}`
          : "";
        documentationLinks.push(`- [${linkTitle}](${mdUrl})${linkDescription}`);
      }
    }

    const llmsTxtParts = [
      `# ${title}`,
      `> ${description}`,
      ...(formattedInstructions ? [formattedInstructions] : []),
      ...(documentationLinks.length > 0
        ? ["## Documentation", documentationLinks.join("\n")]
        : []),
      ...sections.flatMap((section) => {
        const links = section.links.map((link) => {
          const description = link.description
            ? `: ${toSingleLine(link.description)}`
            : "";
          return `- [${escapeMarkdownLinkLabel(link.title)}](${link.url})${description}`;
        });
        return links.length > 0
          ? [`## ${toSingleLine(section.title)}`, links.join("\n")]
          : [];
      }),
    ];

    await writeFile(
      path.join(baseOutputDir, "llms.txt"),
      llmsTxtParts.join("\n\n"),
      "utf-8",
    );

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
      llmsFullParts.push(
        `URL: ${joinUrl(baseUrl, encodeDocumentationRoutePath(info.routePath))}\n`,
      );
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
