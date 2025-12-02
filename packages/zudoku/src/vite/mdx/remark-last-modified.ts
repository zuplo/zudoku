// biome-ignore-all lint/suspicious/noConsole: Console output allowed here
import { spawnSync } from "node:child_process";
import { stat } from "node:fs/promises";
import type { Root } from "mdast";
import { visit } from "unist-util-visit";
import type { VFile } from "vfile";
import { parse, stringify } from "yaml";

let isGitAvailable: boolean;
let hasWarnedShallowClone = false;

const checkGitAvailable = (): boolean => {
  if (isGitAvailable !== undefined) return isGitAvailable;

  const result = spawnSync("git", ["--version"], { stdio: "ignore" });
  isGitAvailable = result.status === 0;

  return isGitAvailable;
};

const isShallowRepository = (): boolean => {
  if (!checkGitAvailable()) return false;

  const result = spawnSync("git", ["rev-parse", "--is-shallow-repository"], {
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "ignore"],
  });

  return result.status === 0 && result.stdout.trim() === "true";
};

const warnShallowClone = (): void => {
  if (hasWarnedShallowClone) return;
  hasWarnedShallowClone = true;

  if (process.env.VERCEL) {
    console.warn(
      "The repository is shallow cloned, so the latest modified time may not be accurate. Set the VERCEL_DEEP_CLONE=true environment variable to enable deep cloning.",
    );
  } else if (process.env.GITHUB_ACTIONS) {
    console.warn(
      "The repository is shallow cloned, so the latest modified time may not be accurate. See https://github.com/actions/checkout#fetch-all-history-for-all-tags-and-branches to fetch all the history.",
    );
  } else {
    console.warn(
      "The repository is shallow cloned, so the latest modified time may not be accurate.",
    );
  }
};

const getLastModifiedDate = async (filePath: string) => {
  if (checkGitAvailable()) {
    const result = spawnSync(
      "git",
      ["log", "-1", "--format=%cI", "--", filePath],
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
  // Check for shallow clone and warn once
  if (isShallowRepository()) {
    warnShallowClone();
  }

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
