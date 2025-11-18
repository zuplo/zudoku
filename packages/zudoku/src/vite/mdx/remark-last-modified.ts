import { execSync } from "node:child_process";
import { stat } from "node:fs/promises";
import type { Root } from "mdast";
import { visit } from "unist-util-visit";
import type { VFile } from "vfile";
import { parse, stringify } from "yaml";

let isGitAvailable: boolean | null = null;

/**
 * Check if git is available in the environment.
 */
const checkGitAvailable = (): boolean => {
  if (isGitAvailable !== null) {
    return isGitAvailable;
  }

  try {
    execSync("git --version", {
      stdio: "ignore",
    });
    isGitAvailable = true;
  } catch {
    isGitAvailable = false;
  }

  return isGitAvailable;
};

/**
 * Get the last modified date for a file by checking git history first,
 * then falling back to file system mtime.
 */
const getLastModifiedDate = async (filePath: string): Promise<Date> => {
  // Try to get the date from git history first, but only if git is available
  if (checkGitAvailable()) {
    try {
      const gitDate = execSync(`git log -1 --format=%aI -- "${filePath}"`, {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "ignore"],
      }).trim();

      if (gitDate) {
        return new Date(gitDate);
      }
    } catch {
      // Git command failed, fall back to file system
    }
  }

  // Fall back to file system mtime
  try {
    const stats = await stat(filePath);
    return stats.mtime;
  } catch {
    // File doesn't exist or can't be accessed
  }

  // Last resort: current date
  return new Date();
};

export const remarkLastModified = () => {
  return async (tree: Root, vfile: VFile) => {
    const path = vfile.path;

    const date = path ? await getLastModifiedDate(path) : new Date();

    const lastModifiedISO = date.toISOString();

    // Update the YAML frontmatter with the last modified time
    let hasYaml = false;
    visit(tree, "yaml", (node) => {
      hasYaml = true;
      const data = parse(node.value) ?? {};
      if (!data.lastModifiedTime) {
        data.lastModifiedTime = lastModifiedISO;
        node.value = stringify(data).trim();
      }
    });

    if (!hasYaml) {
      tree.children.unshift({
        type: "yaml",
        value: stringify({ lastModifiedTime: lastModifiedISO }).trim(),
      });
    }
  };
};
