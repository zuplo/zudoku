import path from "node:path";
import { glob } from "glob";
import type {
  InputNavigationCategory,
  InputNavigationItem,
} from "../../../config/validators/InputNavigationSchema.js";
import { readFrontmatter } from "../../util/readFrontmatter.js";
import type { AutoNavigationOptions } from "./index.js";

interface FileMeta {
  /** Relative path from root, no extension */
  relativePath: string;
  /** Original file path for the doc reference */
  docFile: string;
  /** Frontmatter data */
  data: Record<string, unknown>;
  /** File content (for title extraction) */
  content: string;
  /** Absolute file path */
  absolutePath: string;
}

const DEFAULT_FILES = "/pages/**/*.{md,mdx}";

const toPosixPath = (filePath: string) =>
  filePath.split(path.win32.sep).join(path.posix.sep);

const extractTitleFromContent = (content: string): string | undefined =>
  content.match(/^\s*#\s(.*)$/m)?.at(1);

const getLabel = (meta: FileMeta): string =>
  (meta.data.navigation_label as string) ??
  (meta.data.sidebar_label as string) ??
  (meta.data.title as string) ??
  extractTitleFromContent(meta.content) ??
  formatPathSegment(path.basename(meta.relativePath));

const getOrder = (meta: FileMeta): number => {
  const order =
    meta.data.sidebar_position ?? meta.data.navigation_order ?? Infinity;
  return typeof order === "number" ? order : Infinity;
};

/**
 * Convert a path segment like "getting-started" to "Getting Started"
 */
const formatPathSegment = (segment: string): string =>
  segment.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Build a navigation tree from a flat list of file metadata.
 *
 * Directory structure maps to categories. Index files (index.md/index.mdx)
 * become the category link instead of a separate doc item.
 */
const buildNavigationTree = (
  files: FileMeta[],
  options: AutoNavigationOptions,
): InputNavigationItem[] => {
  type TreeNode = {
    files: FileMeta[];
    children: Map<string, TreeNode>;
    indexFile?: FileMeta;
  };

  const root: TreeNode = { files: [], children: new Map() };

  for (const file of files) {
    const segments = file.relativePath.split("/");
    const fileName = segments.pop()!;
    const isIndex = fileName === "index";

    let current = root;
    for (const segment of segments) {
      if (!current.children.has(segment)) {
        current.children.set(segment, {
          files: [],
          children: new Map(),
        });
      }
      current = current.children.get(segment)!;
    }

    if (isIndex) {
      current.indexFile = file;
    } else {
      current.files.push(file);
    }
  }

  const buildItems = (node: TreeNode): InputNavigationItem[] => {
    const items: InputNavigationItem[] = [];

    const sortedFiles = [...node.files].sort((a, b) => {
      const orderDiff = getOrder(a) - getOrder(b);
      if (orderDiff !== 0) return orderDiff;
      return getLabel(a).localeCompare(getLabel(b));
    });

    for (const file of sortedFiles) {
      if (process.env.NODE_ENV !== "development" && file.data.draft === true) {
        continue;
      }

      items.push(file.docFile);
    }

    const sortedDirs = [...node.children.entries()].sort(
      ([aDirName, a], [bDirName, b]) => {
        const aOrder = a.indexFile ? getOrder(a.indexFile) : Infinity;
        const bOrder = b.indexFile ? getOrder(b.indexFile) : Infinity;
        const orderDiff = aOrder - bOrder;
        if (orderDiff !== 0) return orderDiff;

        const aLabel = a.indexFile
          ? getLabel(a.indexFile)
          : formatPathSegment(aDirName);
        const bLabel = b.indexFile
          ? getLabel(b.indexFile)
          : formatPathSegment(bDirName);
        return aLabel.localeCompare(bLabel);
      },
    );

    for (const [dirName, childNode] of sortedDirs) {
      const childItems = buildItems(childNode);
      const indexFile = childNode.indexFile;

      const label = indexFile
        ? getLabel(indexFile)
        : formatPathSegment(dirName);

      const category: InputNavigationCategory = {
        type: "category",
        label,
        items: childItems,
        ...(options.collapsed !== undefined && {
          collapsed: options.collapsed,
        }),
        ...(options.collapsible !== undefined && {
          collapsible: options.collapsible,
        }),
        ...(indexFile && { link: indexFile.docFile }),
      };

      items.push(category);
    }

    return items;
  };

  return buildItems(root);
};

/**
 * Extract the base directory from glob patterns (the non-glob prefix).
 * For example, `/home/user/pages/**\/*.md` returns `/home/user/pages/`.
 */
const extractGlobBase = (patterns: string[]): string => {
  const bases = patterns.map((pattern) => {
    const globChars = ["*", "?", "[", "{"];
    let firstGlobIndex = pattern.length;
    for (const char of globChars) {
      const idx = pattern.indexOf(char);
      if (idx !== -1 && idx < firstGlobIndex) {
        firstGlobIndex = idx;
      }
    }
    const beforeGlob = pattern.slice(0, firstGlobIndex);
    const lastSlash = beforeGlob.lastIndexOf("/");
    return lastSlash === -1 ? "" : beforeGlob.slice(0, lastSlash + 1);
  });

  if (bases.length === 0) return "";
  return bases.reduce((shortest, base) =>
    base.length < shortest.length ? base : shortest,
  );
};

/**
 * Resolve navigation items from markdown files on disk.
 * This module uses Node.js APIs and must only be imported at build time.
 */
export const resolveAutoNavigation = async (
  options: AutoNavigationOptions,
  rootDir: string,
  docsFiles: string | string[] | undefined,
): Promise<InputNavigationItem[] | undefined> => {
  const globPatterns = options.files
    ? typeof options.files === "string"
      ? [options.files]
      : options.files
    : docsFiles
      ? typeof docsFiles === "string"
        ? [docsFiles]
        : docsFiles
      : [DEFAULT_FILES];

  const excludePatterns = [
    "**/node_modules/**",
    "**/.git/**",
    "**/dist/**",
    ...(options.exclude ?? []),
  ];

  // Resolve patterns starting with `/` relative to rootDir (same as docs.files convention),
  // but only if they look like relative-to-root patterns, not already-absolute paths.
  const resolvedPatterns = globPatterns.map((p) => {
    if (!p.startsWith("/")) return p;
    const posixRoot = toPosixPath(rootDir);
    if (p.startsWith(posixRoot)) return p;
    return path.posix.join(posixRoot, p);
  });

  const matchedFiles = await glob(resolvedPatterns, {
    ignore: excludePatterns,
  }).then((files) => files.map(toPosixPath));

  if (matchedFiles.length === 0) {
    return undefined;
  }

  const globBase = extractGlobBase(resolvedPatterns);

  const fileMetas: FileMeta[] = await Promise.all(
    matchedFiles.map(async (absolutePath) => {
      const { data, content } = await readFrontmatter(absolutePath);

      const relativePath = absolutePath
        .slice(globBase.length)
        .replace(/\.mdx?$/, "");

      const fromRoot = path.posix.relative(rootDir, absolutePath);
      const docFile = fromRoot.replace(/\.mdx?$/, "").replace(/^pages\//, "");

      return {
        relativePath,
        docFile,
        data,
        content,
        absolutePath,
      };
    }),
  );

  const navItems = buildNavigationTree(fileMetas, options);

  if (!options.label) {
    return navItems;
  }

  return [
    {
      type: "category" as const,
      label: options.label,
      ...(options.icon && { icon: options.icon }),
      items: navItems,
    },
  ];
};
