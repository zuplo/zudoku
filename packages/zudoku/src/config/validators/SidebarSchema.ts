import { glob } from "glob";
import matter from "gray-matter";
import { type LucideIcon } from "lucide-react";
import fs from "node:fs/promises";
import type {
  BaseInputSidebarItemCategoryLinkDoc,
  BaseInputSidebarItemDoc,
  InputSidebarItem,
  InputSidebarItemCategory,
  InputSidebarItemCustomPage,
  InputSidebarItemLink,
} from "./InputSidebarSchema.js";

type WithIcon<T> = Omit<T, "icon"> & { icon?: LucideIcon | string };
type AsDoc<T> = Extract<T, { type: "doc" }>;

export type SidebarItemDoc = WithIcon<AsDoc<BaseInputSidebarItemDoc>> & {
  label: string;
  categoryLabel?: string;
};

export type SidebarItemLink = WithIcon<InputSidebarItemLink>;

export type SidebarItemCategoryLinkDoc = WithIcon<
  AsDoc<BaseInputSidebarItemCategoryLinkDoc>
> & { label: string };

export type SidebarItemCategory = WithIcon<
  Omit<InputSidebarItemCategory, "items" | "link">
> & {
  items: SidebarItem[];
  link?: SidebarItemCategoryLinkDoc;
};

export type SidebarItemCustomPage = WithIcon<InputSidebarItemCustomPage>;

export type SidebarItem =
  | SidebarItemDoc
  | SidebarItemLink
  | SidebarItemCategory
  | SidebarItemCustomPage;

export type Sidebar = SidebarItem[];

const extractTitleFromContent = (content: string): string | undefined =>
  content.match(/^\s*#\s(.*)$/m)?.at(1);

const isSidebarItem = (item: unknown): item is SidebarItem =>
  item !== undefined;

export class NavigationResolver {
  private rootDir: string;
  private globPatterns: string[];
  private globFiles: string[] = [];

  constructor(rootDir: string, globPatterns: string[]) {
    this.rootDir = rootDir;
    this.globPatterns = globPatterns;
  }

  async resolve(items: InputSidebarItem[]) {
    this.globFiles = await glob(this.globPatterns, {
      root: this.rootDir,
      ignore: ["**/node_modules/**", "**/.git/**", "**/dist/**"],
    });

    const resolvedItems = await Promise.all(
      items.map((item) => this.resolveItem(item)),
    );

    return resolvedItems.filter(isSidebarItem);
  }

  private async resolveDoc(
    filePath: string,
    categoryLabel?: string,
  ): Promise<SidebarItemDoc | undefined> {
    const foundMatches = this.globFiles.find(
      (file) =>
        file.endsWith(`${filePath}.md`) || file.endsWith(`${filePath}.mdx`),
    );

    if (!foundMatches) {
      throw new Error(
        `File not found for document '${filePath}'. Check your sidebar configuration.`,
      );
    }

    const fileContent = await fs.readFile(foundMatches);
    const { data, content } = matter(fileContent);

    const label =
      data.sidebar_label ??
      data.title ??
      extractTitleFromContent(content) ??
      filePath;

    const icon = data.sidebar_icon;

    const doc: SidebarItemDoc = {
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
  ): Promise<SidebarItemCategoryLinkDoc | undefined> {
    const doc = await this.resolveDoc(file);

    return doc
      ? { type: "doc", file, label: doc.label, icon: doc.icon }
      : undefined;
  }

  private async resolveItemCategoryLinkDoc(
    item: string | BaseInputSidebarItemCategoryLinkDoc,
  ): Promise<SidebarItemCategoryLinkDoc | undefined> {
    if (typeof item === "string") {
      return this.resolveLink(item);
    }

    const doc = await this.resolveDoc(item.file);
    return doc ? { ...item, label: doc.label, icon: doc.icon } : undefined;
  }

  private async resolveSidebarItemDoc(
    item: string | BaseInputSidebarItemDoc,
    categoryLabel?: string,
  ): Promise<SidebarItemDoc | undefined> {
    if (typeof item === "string") {
      return this.resolveDoc(item, categoryLabel);
    }

    const doc = await this.resolveDoc(item.file, categoryLabel);
    return doc ? { ...doc, ...item } : undefined;
  }

  private async resolveItem(
    item: InputSidebarItem,
    categoryLabel?: string,
  ): Promise<SidebarItem | undefined> {
    if (typeof item === "string") {
      return this.resolveDoc(item, categoryLabel);
    }

    switch (item.type) {
      case "doc":
        return this.resolveSidebarItemDoc(item, categoryLabel);
      case "link":
      case "custom-page":
        return item;
      case "category": {
        const categoryItem: InputSidebarItemCategory = item;

        const items = (
          await Promise.all(
            categoryItem.items.map((subItem) =>
              this.resolveItem(subItem, categoryItem.label),
            ),
          )
        ).filter((item): item is SidebarItem => item !== undefined);

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
