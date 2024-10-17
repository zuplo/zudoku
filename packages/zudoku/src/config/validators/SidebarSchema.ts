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

export const resolveSidebar = async (
  rootDir: string,
  parentId: string,
  sidebar: InputSidebarItem[],
): Promise<SidebarItem[]> => {
  const resolveDoc = async (globId: string, categoryLabel?: string) => {
    const foundMatches = await glob(`/**/${globId}.{md,mdx}`, {
      root: rootDir,
    });

    if (foundMatches.length === 0) {
      throw new Error(
        `File not found for document '${globId}'. Check your sidebar configuration.`,
      );
    }

    // Strip parent id if it's prefixed
    // E.g. docs/introduction should work as well as introduction
    const id = globId.startsWith(parentId)
      ? globId.slice(parentId.length)
      : globId;

    const file = await fs.readFile(foundMatches.at(0)!);

    const { data, content } = matter(file);
    const label =
      data.sidebar_label ??
      data.title ??
      extractTitleFromContent(content) ??
      id;

    const icon = data.sidebar_icon;

    return {
      type: "doc",
      id,
      label,
      icon,
      categoryLabel,
    } satisfies SidebarItemDoc;
  };

  const resolveLink = async (id: string) => {
    const doc = await resolveDoc(id);
    return {
      type: "doc",
      id: id,
      label: doc.label,
      icon: doc.icon,
    } satisfies SidebarItemCategoryLinkDoc;
  };

  const resolveSidebarItemCategoryLinkDoc = async (
    item: string | BaseInputSidebarItemCategoryLinkDoc,
  ): Promise<SidebarItemCategoryLinkDoc> => {
    if (typeof item === "string") {
      return resolveLink(item);
    }

    const { label, icon } = await resolveDoc(item.id);

    return { ...item, label, icon };
  };

  const resolveSidebarItemDoc = async (
    item: string | BaseInputSidebarItemDoc,
    categoryLabel?: string,
  ): Promise<SidebarItemDoc> => {
    if (typeof item === "string") {
      return resolveDoc(item, categoryLabel);
    }

    const doc = await resolveDoc(item.id, categoryLabel);

    return { ...doc, ...item };
  };

  const resolveSidebarItem = async (
    item: InputSidebarItem,
    categoryLabel?: string,
  ): Promise<SidebarItem> => {
    if (typeof item === "string") {
      return resolveDoc(item, categoryLabel);
    }

    switch (item.type) {
      case "doc":
        return resolveSidebarItemDoc(item, categoryLabel);
      case "link":
        return item;
      case "category": {
        const categoryItem = item;

        const items = await Promise.all(
          categoryItem.items.map((subItem) =>
            resolveSidebarItem(subItem, categoryItem.label),
          ),
        );

        const resolvedLink = categoryItem.link
          ? await resolveSidebarItemCategoryLinkDoc(categoryItem.link)
          : undefined;

        return {
          ...categoryItem,
          items,
          link: resolvedLink,
        };
      }
    }
  };

  return Promise.all(sidebar.map((item) => resolveSidebarItem(item)));
};

export type Sidebar = SidebarItem[];
export type SidebarConfig = Record<string, Sidebar>;
