import { glob } from "glob";
import matter from "gray-matter";
import { type LucideIcon } from "lucide-react";
import fs from "node:fs/promises";
import type {
  BaseInputNavigationItemCategoryLinkDoc,
  BaseInputNavigationItemDoc,
  InputNavigationItem,
  InputNavigationItemCategory,
  InputNavigationItemCustomPage,
  InputNavigationItemLink,
} from "./InputNavigationSchema.js";

type WithIcon<T> = Omit<T, "icon"> & { icon?: LucideIcon | string };
type AsDoc<T> = Extract<T, { type: "doc" }>;

export type NavigationItemDoc = WithIcon<AsDoc<BaseInputNavigationItemDoc>> & {
  label: string;
  categoryLabel?: string;
};

export type NavigationItemLink = WithIcon<InputNavigationItemLink>;

export type NavigationItemCategoryLinkDoc = WithIcon<
  AsDoc<BaseInputNavigationItemCategoryLinkDoc>
> & { label: string };

export type NavigationItemCategory = WithIcon<
  Omit<InputNavigationItemCategory, "items" | "link">
> & {
  items: NavigationItem[];
  link?: NavigationItemCategoryLinkDoc;
};

export type NavigationItemCustomPage = WithIcon<InputNavigationItemCustomPage>;

export type NavigationItem =
  | NavigationItemDoc
  | NavigationItemLink
  | NavigationItemCategory
  | NavigationItemCustomPage;

export type Navigation = NavigationItem[];

const extractTitleFromContent = (content: string): string | undefined =>
  content.match(/^\s*#\s(.*)$/m)?.at(1);

const isNavigationItem = (item: unknown): item is NavigationItem =>
  item !== undefined;

export class NavigationResolver {
  private rootDir: string;
  private globPatterns: string[];
  private globFiles: string[] = [];

  constructor(rootDir: string, globPatterns: string[]) {
    this.rootDir = rootDir;
    this.globPatterns = globPatterns;
  }

  async resolve(items: InputNavigationItem[]) {
    this.globFiles = await glob(this.globPatterns, {
      root: this.rootDir,
      ignore: ["**/node_modules/**", "**/.git/**", "**/dist/**"],
    });

    const resolvedItems = await Promise.all(
      items.map((item) => this.resolveItem(item)),
    );

    return resolvedItems.filter(isNavigationItem);
  }

  private async resolveDoc(
    filePath: string,
    categoryLabel?: string,
  ): Promise<NavigationItemDoc | undefined> {
    const foundMatches = this.globFiles.find(
      (file) =>
        file.endsWith(`${filePath}.md`) || file.endsWith(`${filePath}.mdx`),
    );

    if (!foundMatches) {
      throw new Error(
        `File not found for document '${filePath}'. Check your navigation configuration.`,
      );
    }

    const fileContent = await fs.readFile(foundMatches);
    const { data, content } = matter(fileContent);

    const label =
      data.navigation_label ??
      data.sidebar_label ??
      data.title ??
      extractTitleFromContent(content) ??
      filePath;

    const icon = data.navigation_icon ?? data.sidebar_icon;

    const doc: NavigationItemDoc = {
      type: "doc",
      file: filePath,
      label,
      icon,
      categoryLabel,
    };

    return doc;
  }

  private async resolveLink(
    file: string,
  ): Promise<NavigationItemCategoryLinkDoc | undefined> {
    const doc = await this.resolveDoc(file);

    return doc
      ? { type: "doc", file, label: doc.label, icon: doc.icon }
      : undefined;
  }

  private async resolveItemCategoryLinkDoc(
    item: string | BaseInputNavigationItemCategoryLinkDoc,
  ): Promise<NavigationItemCategoryLinkDoc | undefined> {
    if (typeof item === "string") {
      return this.resolveLink(item);
    }

    const doc = await this.resolveDoc(item.file);
    return doc ? { ...item, label: doc.label, icon: doc.icon } : undefined;
  }

  private async resolveNavigationItemDoc(
    item: string | BaseInputNavigationItemDoc,
    categoryLabel?: string,
  ): Promise<NavigationItemDoc | undefined> {
    if (typeof item === "string") {
      return this.resolveDoc(item, categoryLabel);
    }

    const doc = await this.resolveDoc(item.file, categoryLabel);
    return doc ? { ...doc, ...item } : undefined;
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
        return item;
      case "category": {
        const categoryItem: InputNavigationItemCategory = item;

        const items = (
          await Promise.all(
            categoryItem.items.map((subItem) =>
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
