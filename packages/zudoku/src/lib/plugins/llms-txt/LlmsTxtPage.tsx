import type { LlmsTxtPluginOptions } from "./index.js";

interface LlmsTxtPageProps {
  content: string;
}

interface MarkdownFile {
  path: string;
  title: string;
  description?: string;
  content?: string;
}

export const LlmsTxtPage = ({ content }: LlmsTxtPageProps) => {
  return (
    <pre
      style={{
        whiteSpace: "pre-wrap",
        fontFamily: "monospace",
        margin: 0,
        padding: "1rem",
        overflow: "auto",
      }}
    >
      {content}
    </pre>
  );
};

export function generateLlmsTxtContent(
  variant: "basic" | "full",
  options: LlmsTxtPluginOptions,
  markdownFiles: MarkdownFile[],
): string {
  const lines: string[] = [];

  // H1 title (required)
  const title = options.title || "Documentation";
  lines.push(`# ${title}`, "");

  // Blockquote description (optional but recommended)
  if (options.description) {
    lines.push(`> ${options.description}`, "");
  }

  // Main documentation section
  if (markdownFiles.length > 0) {
    lines.push("## Documentation", "");

    for (const file of markdownFiles) {
      const description = file.description ? `: ${file.description}` : "";
      lines.push(`- [${file.title}](${file.path})${description}`);
    }
    lines.push("");
  }

  // Custom sections
  if (options.customSections) {
    for (const section of options.customSections) {
      // Skip optional sections in basic variant unless specifically requested
      if (
        variant === "basic" &&
        section.optional &&
        !options.includeOptionalSection
      ) {
        continue;
      }

      lines.push(`## ${section.title}`, "");

      for (const item of section.items) {
        const description = item.description ? `: ${item.description}` : "";
        lines.push(`- [${item.title}](${item.url})${description}`);
      }
      lines.push("");
    }
  }

  // Full variant includes content of markdown files
  if (variant === "full") {
    lines.push("---", "", "## Full Documentation Content", "");

    for (const file of markdownFiles) {
      if (file.content) {
        lines.push(`### ${file.title}`, "");
        lines.push(file.content, "");
      }
    }
  }

  return lines.join("\n").trim();
}
