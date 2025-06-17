import type { Root } from "mdast";
import { execSync } from "node:child_process";
import { stat } from "node:fs/promises";
import { visit } from "unist-util-visit";
import type { VFile } from "vfile";
import { parse, stringify } from "yaml";

const gitTime = (path: string) => {
  try {
    const iso = execSync(`git log -1 --pretty=format:%aI -- "${path}"`, {
      encoding: "utf8",
    }).trim();
    return iso ? new Date(iso) : undefined;
  } catch {
    // file not tracked / outside repo
    return undefined;
  }
};

const isGitDirty = (path: string) => {
  try {
    return Boolean(
      execSync(`git status --porcelain -- "${path}"`, {
        encoding: "utf8",
      }).trim(),
    );
  } catch {
    return false;
  }
};

export const remarkLastModified = () => {
  return async (tree: Root, vfile: VFile) => {
    const path = vfile.path;

    const mtime = path ? (await stat(path)).mtime : undefined;
    const gtime = path ? gitTime(path) : undefined;
    const isDirty = path ? isGitDirty(path) : false;

    const date = isDirty
      ? (mtime ?? new Date())
      : (gtime ?? mtime ?? new Date());

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

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!hasYaml) {
      tree.children.unshift({
        type: "yaml",
        value: stringify({ lastModifiedTime: lastModifiedISO }).trim(),
      });
    }
  };
};
