import { glob } from "glob";
import matter from "gray-matter";
import { type LucideIcon } from "lucide-react";
import fs from "node:fs/promises";
import type {
  BaseInputSidebarItemCategoryLinkDoc,
  BaseInputSidebarItemDoc,
  InputSidebarItem,
  InputSidebarItemCategory,
  InputSidebarItemLink,
} from "./InputSidebarSchema.js";
import type { ZudokuConfig } from "./validate.js";

export type SidebarItemDoc = Omit<BaseInputSidebarItemDoc, "icon"> & {
  label: string;
  categoryLabel?: string;
  icon?: LucideIcon | string;
};

export type SidebarItemLink = InputSidebarItemLink & {
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

export type SidebarItem =
  | SidebarItemDoc
  | SidebarItemLink
  | SidebarItemCategory;

const extractTitleFromContent = (content: string): string | undefined =>
  content.match(/^\s*#\s(.*)$/m)?.at(1);

const isSidebarItem = (item: unknown): item is SidebarItem =>
  item !== undefined;

export class SidebarManager {
  sidebars: SidebarClass[];
  private switchQueue: Array<{ from: string; to: string; item: SidebarItem }> =
    [];
  constructor(rootDir: string, sidebarConfig: ZudokuConfig["sidebar"]) {
    this.sidebars = Object.entries(sidebarConfig ?? {}).map(
      ([parent, items]) => new SidebarClass(this, rootDir, parent, items),
    );
  }

  async resolveSidebars() {
    await Promise.all(this.sidebars.map((sidebar) => sidebar.resolve()));

    // switch all collected items
    for (const { from, to, item } of this.switchQueue) {
      const fromSidebar = this.sidebars.find((s) => s.parent === from);
      const toSidebar = this.sidebars.find((s) => s.parent === to);

      if (!fromSidebar || !toSidebar) {
        throw new Error(`Sidebar ${from} or ${to} not found`);
      }

      fromSidebar.resolvedItems = fromSidebar.resolvedItems.filter(
        (resolvedItem) => resolvedItem !== item,
      );
      toSidebar.resolvedItems.push(item);
    }

    return Object.fromEntries(
      this.sidebars.map((sidebar) => [sidebar.parent, sidebar.resolvedItems]),
    );
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
    id: string,
    categoryLabel?: string,
  ): Promise<SidebarItemDoc | undefined> {
    const foundMatches = await glob(`/**/${id}.{md,mdx}`, {
      ignore: ["**/node_modules/**", "**/.git/**", "**/dist/**"],
      root: this.rootDir,
    });

    if (foundMatches.length === 0) {
      throw new Error(
        `File not found for document '${id}'. Check your sidebar configuration.`,
      );
    }

    const file = await fs.readFile(foundMatches.at(0)!);

    const { data, content } = matter(file);

    const label =
      data.sidebar_label ??
      data.title ??
      extractTitleFromContent(content) ??
      id;

    const icon = data.sidebar_icon;

    const doc: SidebarItemDoc = {
      type: "doc",
      id,
      label,
      icon,
      categoryLabel,
    };

    if (data.sidebar && data.sidebar !== this.parent) {
      this.manager.switchSidebar(this.parent, data.sidebar, doc);
      return undefined;
    }

    return doc;
  }

  private async resolveLink(
    id: string,
  ): Promise<SidebarItemCategoryLinkDoc | undefined> {
    const doc = await this.resolveDoc(id);

    return doc
      ? { type: "doc", id: id, label: doc.label, icon: doc.icon }
      : undefined;
  }

  private async resolveItemCategoryLinkDoc(
    item: string | BaseInputSidebarItemCategoryLinkDoc,
  ): Promise<SidebarItemCategoryLinkDoc | undefined> {
    if (typeof item === "string") {
      return this.resolveLink(item);
    }

    const doc = await this.resolveDoc(item.id);
    return doc ? { ...item, label: doc.label, icon: doc.icon } : undefined;
  }

  private async resolveSidebarItemDoc(
    item: string | BaseInputSidebarItemDoc,
    categoryLabel?: string,
  ): Promise<SidebarItemDoc | undefined> {
    if (typeof item === "string") {
      return this.resolveDoc(item, categoryLabel);
    }

    const doc = await this.resolveDoc(item.id, categoryLabel);
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
export type SidebarConfig = Record<string, Sidebar>;
