import path from "node:path";
import { glob } from "glob";
import globParent from "glob-parent";
import type { RootContent } from "hast";
import type { LucideIcon } from "lucide-react";
import type { Heading, PhrasingContent } from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";
import { mdxFromMarkdown } from "mdast-util-mdx";
import type { MdxJsxTextElement } from "mdast-util-mdx-jsx";
import { mdxjs } from "micromark-extension-mdxjs";
import type { SortableType } from "../../lib/navigation/applyRules.js";
import { readFrontmatter } from "../../lib/util/readFrontmatter.js";
import type { ConfigWithMeta } from "../loader.js";
import type {
  InputNavigationCategory,
  InputNavigationCategoryLinkDoc,
  InputNavigationCustomPage,
  InputNavigationDoc,
  InputNavigationFilter,
  InputNavigationItem,
  InputNavigationLink,
  InputNavigationSection,
  InputNavigationSeparator,
  NavigationInsertRule,
  NavigationModifyRule,
  NavigationMoveRule,
  NavigationRemoveRule,
  NavigationRule,
  NavigationSortRule,
} from "./InputNavigationSchema.js";
import { DocsConfigSchema } from "./ZudokuConfig.js";

type ReplaceFields<Base, Overrides> = Omit<Base, keyof Overrides> & Overrides;
// string icons will be transformed to `LucideIcon` in `vite/plugin-navigation.ts`
type ResolvedIcon = { icon?: LucideIcon | string };

// `doc` items can have string shorthands, but this resolver will resolve them to the full type
type FinalNavigationDoc = Extract<InputNavigationDoc, { type: "doc" }>;
type FinalNavigationCategoryLinkDoc = Extract<
  InputNavigationCategoryLinkDoc,
  { type: "doc" }
>;

export type NavigationDoc = ReplaceFields<
  FinalNavigationDoc,
  {
    label: string;
    categoryLabel?: string;
    path: string;
    rich?: RootContent[];
  } & ResolvedIcon
>;

export type NavigationLink = ReplaceFields<InputNavigationLink, ResolvedIcon>;

export type NavigationCategoryLinkDoc = ReplaceFields<
  FinalNavigationCategoryLinkDoc,
  { label: string; path: string } & ResolvedIcon
>;

export type NavigationCategory = ReplaceFields<
  InputNavigationCategory,
  {
    items: NavigationItem[];
    link?: NavigationCategoryLinkDoc;
  } & ResolvedIcon
>;
export type NavigationCustomPage = ReplaceFields<
  InputNavigationCustomPage,
  ResolvedIcon
>;

export type NavigationSeparator = InputNavigationSeparator & { label: string };

export type NavigationSection = InputNavigationSection;

export type NavigationFilter = InputNavigationFilter & { label: string };

export type NavigationItem =
  | NavigationDoc
  | NavigationLink
  | NavigationCategory
  | NavigationCustomPage
  | NavigationSeparator
  | NavigationSection
  | NavigationFilter;

export type SortableNavigationItem = Extract<
  NavigationItem,
  { type: SortableType }
>;

export type Navigation = NavigationItem[];

const extractTitleFromContent = (content: string): string | undefined =>
  content.match(/^\s*#\s(.*)$/m)?.at(1);

type MdxPhrasingContent = PhrasingContent | MdxJsxTextElement;

const isMdxJsxElement = (node: MdxPhrasingContent): node is MdxJsxTextElement =>
  node.type === "mdxJsxTextElement";

const mdastToString = (node: MdxPhrasingContent | Heading): string => {
  if ("value" in node && typeof node.value === "string") return node.value;
  if ("children" in node && Array.isArray(node.children)) {
    return node.children
      .map((c) => mdastToString(c as MdxPhrasingContent))
      .join("");
  }

  return "";
};

// Extract rich H1 heading content from MDX. Returns AST nodes only when H1 contains JSX elements.
const extractRichH1 = (content: string) => {
  try {
    const mdast = fromMarkdown(content, {
      extensions: [mdxjs()],
      mdastExtensions: [mdxFromMarkdown()],
      // biome-ignore lint/suspicious/noExplicitAny: mdast-util-from-markdown has type incompatibilities between versions
    } as any);

    const h1 = mdast.children.find(
      (node): node is Heading => node.type === "heading" && node.depth === 1,
    );

    if (!h1) return undefined;

    const children = h1.children as MdxPhrasingContent[];
    const hasJsx = children.some(isMdxJsxElement);

    // Extract all text content including from emphasis/strong/links
    const label = mdastToString(h1).trim();

    // Note: rich only contains MDAST nodes. RichText handles text and mdxJsxTextElement,
    // but markdown formatting (strong/emphasis/link) in H1 won't render styled.
    return hasJsx ? { label, rich: children as RootContent[] } : { label };
  } catch {
    return undefined;
  }
};

const isNavigationItem = (item: unknown): item is NavigationItem =>
  item !== undefined;

const toPosixPath = (filePath: string) =>
  filePath.split(path.win32.sep).join(path.posix.sep);

const prettifyDirName = (name: string): string =>
  name.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

type AutoNavFileInfo = {
  routePath: string;
  filePath: string;
  label: string;
  icon?: string;
  display?: NavigationDoc["display"];
  position?: number;
  rich?: RootContent[];
};

type NavTreeNode = {
  files: AutoNavFileInfo[];
  dirs: Map<string, NavTreeNode>;
};

export type ResolvedNavigationInsertRule = Omit<
  NavigationInsertRule,
  "items"
> & { items: NavigationItem[] };

export type ResolvedNavigationRule =
  | NavigationModifyRule
  | NavigationRemoveRule
  | ResolvedNavigationInsertRule
  | NavigationSortRule
  | NavigationMoveRule;

export class NavigationResolver {
  private rootDir: string;
  private globPatterns: string[];
  private globFiles: string[] = [];
  private items: InputNavigationItem[] = [];
  private itemIndex = 0;
  private hasExplicitNavigation: boolean;

  constructor(config: ConfigWithMeta) {
    this.rootDir = config.__meta.rootDir;
    this.globPatterns = DocsConfigSchema.parse(config.docs ?? {}).files;
    this.hasExplicitNavigation = config.navigation !== undefined;
    this.items = config.navigation ?? [];
  }

  async initialize() {
    if (this.globFiles.length > 0) return;

    this.globFiles = await glob(this.globPatterns, {
      root: this.rootDir,
      ignore: ["**/node_modules/**", "**/.git/**", "**/dist/**"],
    }).then((files) => files.map(toPosixPath));
  }

  async resolve() {
    if (!this.hasExplicitNavigation) {
      return this.generateFromFileSystem();
    }

    await this.initialize();

    const resolvedItems = await Promise.all(
      this.items.map((item) => this.resolveItem(item)),
    );

    return resolvedItems.filter(isNavigationItem);
  }

  async resolveRules(
    rules: NavigationRule[],
  ): Promise<ResolvedNavigationRule[]> {
    await this.initialize();

    return Promise.all(
      rules.map(async (rule) => {
        if (rule.type === "insert") {
          const items = await Promise.all(
            rule.items.map((item) => this.resolveItem(item)),
          ).then((items) => items.filter(isNavigationItem));

          return { ...rule, items };
        }
        return rule;
      }),
    );
  }

  private async resolveDoc(
    filePath: string,
    categoryLabel?: string,
  ): Promise<NavigationDoc | undefined> {
    const fileNoExt = toPosixPath(filePath).replace(/\.mdx?$/, "");

    const foundMatches = this.globFiles.find(
      (file) =>
        file.endsWith(`${fileNoExt}.md`) || file.endsWith(`${fileNoExt}.mdx`),
    );

    if (!foundMatches) {
      throw new Error(
        `File not found for document '${filePath}'. Navigation items of type 'doc' must point to a valid .md or .mdx file. Do you mean 'link' or 'custom-page'? Check navigation configuration documentation for more information: https://zudoku.dev/docs/configuration/navigation`,
      );
    }

    const { data, content } = await readFrontmatter(foundMatches);

    // Skip draft documents in production mode
    if (process.env.NODE_ENV !== "development" && data.draft === true) {
      return undefined;
    }

    const richH1 = extractRichH1(content);

    const label =
      data.navigation_label ??
      data.sidebar_label ??
      data.title ??
      richH1?.label ??
      extractTitleFromContent(content) ??
      filePath;

    const icon = data.navigation_icon ?? data.sidebar_icon;

    const doc = {
      type: "doc",
      file: filePath,
      label,
      icon,
      display: data.navigation_display,
      categoryLabel,
      path: fileNoExt,
      rich: richH1?.rich,
    } satisfies NavigationDoc;

    return doc;
  }

  private async resolveLink(
    file: string,
  ): Promise<NavigationCategoryLinkDoc | undefined> {
    const doc = await this.resolveDoc(file);

    return doc
      ? { type: "doc", file, label: doc.label, icon: doc.icon, path: doc.path }
      : undefined;
  }

  private async resolveItemCategoryLinkDoc(
    item: string | InputNavigationCategoryLinkDoc,
  ): Promise<NavigationCategoryLinkDoc | undefined> {
    if (typeof item === "string") {
      return this.resolveLink(item);
    }

    const doc = await this.resolveDoc(item.file);
    return doc
      ? {
          ...item,
          label: doc.label,
          icon: doc.icon,
          path: item.path ?? doc.path,
        }
      : undefined;
  }

  private async resolveNavigationItemDoc(
    item: string | InputNavigationDoc,
    categoryLabel?: string,
  ): Promise<NavigationDoc | undefined> {
    if (typeof item === "string") {
      return this.resolveDoc(item, categoryLabel);
    }

    const doc = await this.resolveDoc(item.file, categoryLabel);
    return doc ? { ...doc, ...item, path: item.path ?? doc.path } : undefined;
  }

  private async resolveItem(
    item: InputNavigationItem,
    categoryLabel?: string,
  ): Promise<NavigationItem | undefined> {
    if (typeof item === "string") {
      return this.resolveDoc(item, categoryLabel);
    }

    switch (item.type) {
      case "doc":
        return this.resolveNavigationItemDoc(item, categoryLabel);
      case "link":
      case "custom-page":
      case "section":
        return item;
      case "separator":
        return { ...item, label: `separator-${this.itemIndex++}` };
      case "filter":
        return { ...item, label: `filter-${this.itemIndex++}` };
      case "category": {
        const categoryItem = item;

        const items = (
          await Promise.all(
            (categoryItem.items as InputNavigationItem[]).map((subItem) =>
              this.resolveItem(subItem, categoryItem.label),
            ),
          )
        ).filter(isNavigationItem);

        const resolvedLink = categoryItem.link
          ? await this.resolveItemCategoryLinkDoc(categoryItem.link)
          : undefined;

        // Filter out empty categories (no items and no link) in production
        if (
          process.env.NODE_ENV !== "development" &&
          items.length === 0 &&
          !resolvedLink
        ) {
          return undefined;
        }

        return {
          ...categoryItem,
          items,
          link: resolvedLink,
        };
      }
    }
  }

  private async generateFromFileSystem(): Promise<NavigationItem[]> {
    const fileInfos: AutoNavFileInfo[] = [];
    const seen = new Set<string>();

    for (const globPattern of this.globPatterns) {
      const globbedFiles = await glob(globPattern, {
        root: this.rootDir,
        ignore: ["**/node_modules/**", "**/.git/**", "**/dist/**"],
        absolute: false,
        posix: true,
      });

      const parent = globParent(globPattern).replace(/^\.?\//, "");

      for (const file of globbedFiles) {
        const relativePath = path.posix.relative(parent, file);
        const routePath = relativePath.replace(/\.mdx?$/, "");

        if (seen.has(routePath)) continue;
        seen.add(routePath);

        const absolutePath = path.resolve(this.rootDir, file);
        const { data, content } = await readFrontmatter(absolutePath);

        if (process.env.NODE_ENV !== "development" && data.draft === true) {
          continue;
        }

        const richH1 = extractRichH1(content);
        const label =
          data.navigation_label ??
          data.sidebar_label ??
          data.title ??
          richH1?.label ??
          extractTitleFromContent(content) ??
          prettifyDirName(path.posix.basename(routePath));

        fileInfos.push({
          routePath,
          filePath: routePath,
          label,
          icon: data.navigation_icon ?? data.sidebar_icon,
          display: data.navigation_display,
          position: data.sidebar_position,
          rich: richH1?.rich,
        });
      }
    }

    return this.buildNavigationTree(fileInfos);
  }

  private buildNavigationTree(files: AutoNavFileInfo[]): NavigationItem[] {
    const root: NavTreeNode = { files: [], dirs: new Map() };

    for (const file of files) {
      const segments = file.routePath.split("/");
      let current = root;

      for (let i = 0; i < segments.length - 1; i++) {
        const seg = segments[i];
        if (seg == null) continue;
        if (!current.dirs.has(seg)) {
          current.dirs.set(seg, { files: [], dirs: new Map() });
        }
        const next = current.dirs.get(seg);
        if (next == null) continue;
        current = next;
      }

      current.files.push(file);
    }

    return this.treeToNavigation(root);
  }

  private treeToNavigation(node: NavTreeNode): NavigationItem[] {
    // Identify files that match a directory name (become category links)
    const dirLinkFiles = new Map<string, AutoNavFileInfo>();
    for (const file of node.files) {
      const fileName = file.routePath.split("/").pop() ?? "";
      if (fileName && node.dirs.has(fileName)) {
        dirLinkFiles.set(fileName, file);
      }
    }

    type SortEntry =
      | { kind: "file"; info: AutoNavFileInfo }
      | {
          kind: "dir";
          name: string;
          node: NavTreeNode;
          linkFile?: AutoNavFileInfo;
        };

    const entries: SortEntry[] = [];

    for (const file of node.files) {
      const fileName = file.routePath.split("/").pop() ?? "";
      if (!dirLinkFiles.has(fileName)) {
        entries.push({ kind: "file", info: file });
      }
    }

    for (const [dirName, childNode] of node.dirs) {
      entries.push({
        kind: "dir",
        name: dirName,
        node: childNode,
        linkFile: dirLinkFiles.get(dirName),
      });
    }

    // Positioned items first (by position), then alphabetical by label
    entries.sort((a, b) => {
      const posA = a.kind === "file" ? a.info.position : a.linkFile?.position;
      const posB = b.kind === "file" ? b.info.position : b.linkFile?.position;

      if (posA != null && posB != null) return posA - posB;
      if (posA != null) return -1;
      if (posB != null) return 1;

      const labelA = a.kind === "file" ? a.info.label : prettifyDirName(a.name);
      const labelB = b.kind === "file" ? b.info.label : prettifyDirName(b.name);
      return labelA.localeCompare(labelB);
    });

    return entries.map((entry): NavigationItem => {
      if (entry.kind === "file") {
        return {
          type: "doc",
          file: entry.info.filePath,
          label: entry.info.label,
          icon: entry.info.icon,
          display: entry.info.display,
          path: entry.info.routePath,
          rich: entry.info.rich,
        } as NavigationDoc;
      }

      const categoryItems = this.treeToNavigation(entry.node);
      const link: NavigationCategoryLinkDoc | undefined = entry.linkFile
        ? {
            type: "doc",
            file: entry.linkFile.filePath,
            label: entry.linkFile.label,
            icon: entry.linkFile.icon,
            path: entry.linkFile.routePath,
          }
        : undefined;

      return {
        type: "category",
        label: entry.linkFile?.label ?? prettifyDirName(entry.name),
        items: categoryItems,
        link,
      } as NavigationCategory;
    });
  }
}
