/* eslint-disable no-console */

import { readFileSync, readdirSync, statSync } from "fs";
import path, { join, relative } from "path";

const ADMONITION_TYPES = ["note", "tip", "warning", "caution", "danger"];
const DOCS_DIR = path.resolve(import.meta.dirname, "../pages");

let totalIssues = 0;
const issues = [];

function getAllMarkdownFiles(dir) {
  const files = [];

  function walk(currentDir) {
    const entries = readdirSync(currentDir);

    for (const entry of entries) {
      const fullPath = join(currentDir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory() && !entry.startsWith(".")) {
        walk(fullPath);
      } else if (
        stat.isFile() &&
        (entry.endsWith(".md") || entry.endsWith(".mdx"))
      ) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

function checkAdmonitions(filePath) {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const fileIssues = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const admonitionMatch = line.match(
      new RegExp(`^:::(${ADMONITION_TYPES.join("|")})(?:\\{.*\\})?\\s*$`),
    );

    if (admonitionMatch) {
      const admonitionType = admonitionMatch[1];
      let hasIssue = false;

      // Check for blank line after opening
      if (i + 1 < lines.length && lines[i + 1].trim() !== "") {
        fileIssues.push({
          line: i + 1,
          type: "missing-blank-after-opening",
          message: `Missing blank line after opening :::${admonitionType}`,
        });
        hasIssue = true;
      }

      // Find the closing :::
      let closingIndex = -1;
      let depth = 1;

      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].trim() === ":::") {
          depth--;
          if (depth === 0) {
            closingIndex = j;
            break;
          }
        } else if (lines[j].match(/^:::(note|tip|warning|caution|danger)/)) {
          depth++;
        }
      }

      if (closingIndex === -1) {
        fileIssues.push({
          line: i + 1,
          type: "unclosed-admonition",
          message: `Unclosed admonition :::${admonitionType}`,
        });
      } else {
        // Check for blank line before closing
        if (closingIndex > 0 && lines[closingIndex - 1].trim() !== "") {
          fileIssues.push({
            line: closingIndex + 1,
            type: "missing-blank-before-closing",
            message: `Missing blank line before closing ::: for ${admonitionType}`,
          });
          hasIssue = true;
        }
      }
    }
  }

  return fileIssues;
}

console.log("Checking admonitions in markdown files...\n");

const markdownFiles = getAllMarkdownFiles(DOCS_DIR);
console.log(`Found ${markdownFiles.length} markdown files to check.\n`);

for (const file of markdownFiles) {
  const relativePath = relative(process.cwd(), file);

  // Skip the admonitions documentation file
  if (relativePath === "pages/markdown/admonitions.md") {
    continue;
  }

  const fileIssues = checkAdmonitions(file);

  if (fileIssues.length > 0) {
    issues.push({ file: relativePath, issues: fileIssues });
    totalIssues += fileIssues.length;
  }
}

if (totalIssues === 0) {
  console.log("✅ All admonitions are correctly formatted!");
  process.exit(0);
} else {
  console.log(
    `❌ Found ${totalIssues} formatting issue${totalIssues === 1 ? "" : "s"}:\n`,
  );

  for (const { file, issues: fileIssues } of issues) {
    for (const issue of fileIssues) {
      console.log(`${file}:${issue.line}:1: ${issue.message}`);
    }
  }

  console.log("\n\nCorrect format example:");
  console.log("```");
  console.log(":::note");
  console.log("");
  console.log("This is a note admonition.");
  console.log("");
  console.log(":::");
  console.log("```");

  process.exit(1);
}
