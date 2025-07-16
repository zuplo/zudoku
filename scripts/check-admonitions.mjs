/* eslint-disable no-console */

import { readFileSync } from "fs";
import { globSync } from "node:fs";
import path, { relative } from "path";

const ADMONITION_TYPES = ["note", "tip", "warning", "caution", "danger"];

// Parse command line arguments for glob patterns
const args = process.argv.slice(2);

// Show help if requested
if (args.includes("--help") || args.includes("-h")) {
  console.log(`
Usage: node check-admonitions.mjs [glob patterns...]

Check markdown files for properly formatted admonitions.

Examples:
  # Check default directories
  node check-admonitions.mjs
  
  # Check specific directories
  node check-admonitions.mjs "docs/**/*.mdx" "examples/**/*.md"
  
  # Check all markdown files
  node check-admonitions.mjs "**/*.{md,mdx}"

Options:
  -h, --help    Show this help message
`);
  process.exit(0);
}

const globPatterns =
  args.length > 0
    ? args
    : ["docs/pages/**/*.{md,mdx}", "examples/**/pages/**/*.{md,mdx}"];

const IGNORE_FILES = ["docs/pages/markdown/admonitions.md"];

let totalIssues = 0;
const issues = [];

function getAllMarkdownFiles(patterns) {
  const files = new Set();

  for (const pattern of patterns) {
    try {
      // Use Node.js built-in globSync (available in Node.js 22+)
      const matches = globSync(pattern, {
        exclude: (path) =>
          path.includes("node_modules") || path.includes(".git"),
      });

      for (const match of matches) {
        files.add(path.resolve(match));
      }
    } catch (error) {
      console.error(`Error processing pattern "${pattern}":`, error.message);
    }
  }

  return Array.from(files);
}

function checkAdmonitions(filePath) {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const fileIssues = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for inline admonitions (all on one line with content and closing)
    // This handles both non-indented and indented cases
    const inlineAdmonitionMatch = line.match(
      new RegExp(
        `(\\s*):::(${ADMONITION_TYPES.join("|")})(?:\\{.*\\})?\\s+(.+?)\\s*:::`,
      ),
    );

    if (inlineAdmonitionMatch) {
      const type = inlineAdmonitionMatch[2];
      fileIssues.push({
        line: i + 1,
        type: "inline-admonition",
        message: `Inline admonition :::${type} detected. Admonitions must be on separate lines with blank lines`,
      });
      continue;
    }

    // Check for admonitions that start but have content on same line
    const admonitionWithContentMatch = line.match(
      new RegExp(
        `^(\\s*):::(${ADMONITION_TYPES.join("|")})(?:\\{.*\\})?\\s+(.+)`,
      ),
    );

    if (admonitionWithContentMatch) {
      fileIssues.push({
        line: i + 1,
        type: "content-on-opening-line",
        message: `Content found on the same line as opening :::${admonitionWithContentMatch[2]}. Content must start on the next line after a blank line`,
      });
      continue;
    }

    // Check for standard admonition opening
    const admonitionMatch = line.match(
      new RegExp(`^(\\s*):::(${ADMONITION_TYPES.join("|")})(?:\\{.*\\})?\\s*$`),
    );

    if (admonitionMatch) {
      const indent = admonitionMatch[1];
      const admonitionType = admonitionMatch[2];

      // Check for blank line after opening
      if (i + 1 < lines.length && lines[i + 1].trim() !== "") {
        fileIssues.push({
          line: i + 1,
          type: "missing-blank-after-opening",
          message: `Missing blank line after opening :::${admonitionType}`,
        });
      }

      // Find the closing :::
      let closingIndex = -1;
      let depth = 1;

      for (let j = i + 1; j < lines.length; j++) {
        // Match closing ::: with proper indentation
        if (lines[j].match(new RegExp(`^${indent}:::\\s*$`))) {
          depth--;
          if (depth === 0) {
            closingIndex = j;
            break;
          }
        } else if (
          lines[j].match(new RegExp(`^\\s*:::(${ADMONITION_TYPES.join("|")})`))
        ) {
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
        }
      }
    }

    // Check for closing ::: that has content on same line (but not indented closing)
    if (line.match(/^(.+\S)\s*:::$/) && !line.match(/^\s*:::$/)) {
      fileIssues.push({
        line: i + 1,
        type: "content-on-closing-line",
        message: `Content found on the same line as closing :::. Content must end on the previous line with a blank line before :::`,
      });
    }
  }

  return fileIssues;
}

function main() {
  console.log("Checking admonitions in markdown files...\n");

  if (args.length > 0) {
    console.log(`Using glob patterns: ${args.join(", ")}\n`);
  }

  const markdownFiles = getAllMarkdownFiles(globPatterns);
  console.log(`Found ${markdownFiles.length} markdown files to check.\n`);

  for (const file of markdownFiles) {
    const relativePath = relative(process.cwd(), file);

    // Skip the admonitions documentation file
    if (IGNORE_FILES.includes(relativePath)) {
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

    process.exit(1);
  }
}

// Run the main function
try {
  main();
} catch (error) {
  console.error("Error:", error);
  process.exit(1);
}
