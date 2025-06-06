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
import type { ZudokuConfig } from "./validate.js";

export type SidebarItemDoc = Omit<BaseInputSidebarItemDoc, "icon"> & {
  label: string;
  categoryLabel?: string;
  icon?: LucideIcon | string;
};

export type SidebarItemLink = Omit<InputSidebarItemLink, "icon"> & {
  icon?: LucideIcon | string;
};

export type SidebarItemCategoryLinkDoc = BaseInputSidebarItemCategoryLinkDoc & {
  label: string;
  icon?: LucideIcon | string;
};

export type SidebarItemCategory = Omit<
  InputSidebarItemCategory,
  "items" | "link" | "icon"
> & {
  items: SidebarItem[];
  link?: SidebarItemCategoryLinkDoc;
  icon?: LucideIcon | string;
};

export type SidebarItemCustomPage = Omit<InputSidebarItemCustomPage, "icon"> & {
  icon?: LucideIcon | string;
};

export type SidebarItem =
  | SidebarItemDoc
  | SidebarItemLink
  | SidebarItemCategory
  | SidebarItemCustomPage;

const extractTitleFromContent = (content: string): string | undefined =>
  content.match(/^\s*#\s(.*)$/m)?.at(1);

const isSidebarItem = (item: unknown): item is SidebarItem =>
  item !== undefined;

export class SidebarManager {
  sidebars: SidebarClass;
  private switchQueue: Array<{ from: string; to: string; item: SidebarItem }> =
    [];
  constructor(rootDir: string, sidebarConfig: ZudokuConfig["navigation"]) {
    this.sidebars = new SidebarClass(this, rootDir, "", sidebarConfig ?? []);
  }

  async resolveSidebars() {
    await this.sidebars.resolve();

    // switch all collected items
    // for (const { from, to, item } of this.switchQueue) {
    //   const fromSidebar = this.sidebars.find((s) => s.parent === from);
    //   const toSidebar = this.sidebars.find((s) => s.parent === to);

    //   if (!fromSidebar || !toSidebar) {
    //     throw new Error(`Sidebar ${from} or ${to} not found`);
    //   }

    //   fromSidebar.resolvedItems = fromSidebar.resolvedItems.filter(
    //     (resolvedItem) => resolvedItem !== item,
    //   );
    //   toSidebar.resolvedItems.push(item);
    // }

    return this.sidebars.resolvedItems;
  }

  switchSidebar(from: string, to: string, item: SidebarItem) {
    this.switchQueue.push({ from, to, item });
  }
}

export class SidebarClass {
  resolvedItems: SidebarItem[] = [];

  constructor(
    private manager: SidebarManager,
    public rootDir: string,
    public parent: string,
    private items: InputSidebarItem[],
  ) {}

  async resolve() {
    const resolvedSidebar = (
      await Promise.all(this.items.map((item) => this.resolveItem(item)))
    ).filter(isSidebarItem);

    this.resolvedItems = resolvedSidebar;
  }

  private async resolveDoc(
    filePath: string,
    categoryLabel?: string,
  ): Promise<SidebarItemDoc | undefined> {
    const foundMatches = await glob(`/**/${filePath}.{md,mdx}`, {
      ignore: ["**/node_modules/**", "**/.git/**", "**/dist/**"],
      root: this.rootDir,
    });

    if (foundMatches.length === 0) {
      throw new Error(
        `File not found for document '${filePath}'. Check your sidebar configuration.`,
      );
    }

    const fileConteent = await fs.readFile(foundMatches.at(0)!);
    const { data, content } = matter(fileConteent);

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

    // if (data.sidebar && data.sidebar !== this.parent) {
    //   this.manager.switchSidebar(this.parent, data.sidebar, doc);
    //   return undefined;
    // }

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
        const categoryItem = item;

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

export type Sidebar = SidebarItem[];
