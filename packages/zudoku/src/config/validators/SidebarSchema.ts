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

const extractTitleFromContent = (content: string) =>
  content.match(/^\s*#\s(.*)$/m)?.at(1);

export const resolveSidebar = async (
  rootDir: string,
  sidebar: InputSidebarItem[],
): Promise<SidebarItem[]> => {
  const resolveDoc = async (
    id: string,
    categoryLabel?: string,
  ): Promise<SidebarItemDoc> => {
    const foundMatches = await glob(`/**/${id}.{md,mdx}`, {
      ignore: ["**/node_modules/**", "**/.git/**", "**/dist/**"],
      root: rootDir,
    });

    if (foundMatches.length === 0) {
      throw new Error(
        `File not found for document '${id}'. Check your sidebar configuration.`,
      );
    }

    const file = await fs.readFile(foundMatches.at(0)!);

    const { data, content } = matter(file);
    const label =
      data.sidebar_label ?? data.title ?? extractTitleFromContent(content);
    const icon = data.sidebar_icon;

    if (typeof label !== "string") {
      throw new Error(
        `Error determining title for document '${id}'. Check that the document has a H1 header or title frontmatter.`,
      );
    }

    return {
      type: "doc",
      id,
      label,
      icon,
      categoryLabel,
    };
  };

  const resolveLink = async (
    id: string,
  ): Promise<SidebarItemCategoryLinkDoc> => {
    const doc = await resolveDoc(id);
    return {
      type: "doc",
      id: id,
      label: doc.label,
      icon: doc.icon,
    };
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
    const label = item.label ?? doc.label;

    return { ...item, label, categoryLabel };
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
