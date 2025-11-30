import path from "node:path";
import { glob } from "glob";
import type { LucideIcon } from "lucide-react";
import { readFrontmatter } from "../../lib/util/readFrontmatter.js";
import type { ConfigWithMeta } from "../loader.js";
import type {
  InputNavigationCategory,
  InputNavigationCategoryLinkDoc,
  InputNavigationCustomPage,
  InputNavigationDoc,
  InputNavigationItem,
  InputNavigationLink,
  InputNavigationSection,
  InputNavigationSeparator,
} from "./InputNavigationSchema.js";
import { DocsConfigSchema } from "./validate.js";

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
  { label: string; categoryLabel?: string; path: string } & ResolvedIcon
>;

export type NavigationLink = ReplaceFields<InputNavigationLink, ResolvedIcon>;

export type NavigationCategoryLinkDoc = ReplaceFields<
  FinalNavigationCategoryLinkDoc,
  { label: string; path: string } & ResolvedIcon
>;

export type NavigationCategory = ReplaceFields<
  InputNavigationCategory,
  { items: NavigationItem[]; link?: NavigationCategoryLinkDoc } & ResolvedIcon
>;
export type NavigationCustomPage = ReplaceFields<
  InputNavigationCustomPage,
  ResolvedIcon
>;

export type NavigationSeparator = InputNavigationSeparator & { label: string };

export type NavigationSection = InputNavigationSection;

export type NavigationItem =
  | NavigationDoc
  | NavigationLink
  | NavigationCategory
  | NavigationCustomPage
  | NavigationSeparator
  | NavigationSection;

export type Navigation = NavigationItem[];

const extractTitleFromContent = (content: string): string | undefined =>
  content.match(/^\s*#\s(.*)$/m)?.at(1);

const isNavigationItem = (item: unknown): item is NavigationItem =>
  item !== undefined;

const toPosixPath = (filePath: string) =>
  filePath.split(path.win32.sep).join(path.posix.sep);

export class NavigationResolver {
  private rootDir: string;
  private globPatterns: string[];
  private globFiles: string[] = [];
  private items: InputNavigationItem[] = [];
  private separatorIndex = 0;

  constructor(config: ConfigWithMeta) {
    this.rootDir = config.__meta.rootDir;
    this.globPatterns = DocsConfigSchema.parse(config.docs ?? {}).files;
    this.items = config.navigation ?? [];
  }

  async resolve() {
    this.globFiles = await glob(this.globPatterns, {
      root: this.rootDir,
      ignore: ["**/node_modules/**", "**/.git/**", "**/dist/**"],
    }).then((files) => files.map(toPosixPath));

    const resolvedItems = await Promise.all(
      this.items.map((item) => this.resolveItem(item)),
    );

    return resolvedItems.filter(isNavigationItem);
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

    const label =
      data.navigation_label ??
      data.sidebar_label ??
      data.title ??
      extractTitleFromContent(content) ??
      filePath;

    const icon = data.navigation_icon ?? data.sidebar_icon;

    const doc = {
      type: "doc",
      file: filePath,
      label,
      icon,
      categoryLabel,
      path: fileNoExt,
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
        return { ...item, label: `separator-${this.separatorIndex++}` };
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

        return {
          ...categoryItem,
          items,
          link: resolvedLink,
        };
      }
    }
  }
}
