import { spawnSync } from "node:child_process";
import { stat } from "node:fs/promises";
import type { Root } from "mdast";
import { visit } from "unist-util-visit";
import type { VFile } from "vfile";
import { parse, stringify } from "yaml";

let isGitAvailable: boolean;

const checkGitAvailable = (): boolean => {
  if (isGitAvailable !== undefined) return isGitAvailable;

  const result = spawnSync("git", ["--version"], { stdio: "ignore" });
  isGitAvailable = result.status === 0;

  return isGitAvailable;
};

const getLastModifiedDate = async (filePath: string) => {
  if (checkGitAvailable()) {
    const result = spawnSync(
      "git",
      ["log", "-1", "--format=%aI", "--", filePath],
      { encoding: "utf-8", stdio: ["pipe", "pipe", "ignore"] },
    );

    if (result.status === 0 && result.stdout) {
      const gitDate = result.stdout.trim();
      if (gitDate) return new Date(gitDate);
    }
  }

  try {
    const stats = await stat(filePath);
    return stats.mtime;
  } catch {
    // File doesn't exist or can't be accessed
  }

  return new Date();
};

export const remarkLastModified = () => {
  return async (tree: Root, vfile: VFile) => {
    const date = await getLastModifiedDate(vfile.path);
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
