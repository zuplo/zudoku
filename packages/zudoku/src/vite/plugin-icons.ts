import matter from "gray-matter";
import type { LucideIcon } from "lucide-react";
import { readFile } from "node:fs/promises";
import type { Plugin } from "vite";

export const annotateIcon = (icon?: string) =>
  icon ? (`__IMPORT_ICON:${icon}__` as unknown as LucideIcon) : undefined;

const matchIconAnnotation = /"__IMPORT_ICON:(.*?)__"/g;

const toPascalCase = (str: string) =>
  str.replace(/(^\w|-\w)/g, (match) => match.replace("-", "").toUpperCase());

export const replaceSidebarAnnotatedIcons = (code: string) => {
  const collectedIcons = new Set<string>();

  let match;
  while ((match = matchIconAnnotation.exec(code)) !== null) {
    collectedIcons.add(match[1]);
  }

  const importStatement = [
    'import React from "react";',
    `import { ${[...collectedIcons].map(toPascalCase).join(", ")} } from "zudoku/icons";`,
  ].join("\n");

  const replacedString = code.replaceAll(
    matchIconAnnotation,
    // The element will be created by the implementers side
    (_, iconName) => toPascalCase(iconName),
  );

  return `${importStatement}export const configuredSidebar = ${replacedString};`;
};

export const viteIconsPlugin = (): Plugin => {
  const iconMap = new Map<string, string | null>();

  return {
    enforce: "pre",
    name: "zudoku-icons-plugin",
    configureServer: ({ watcher, restart }) => {
      watcher.on("change", async (filePath) => {
        if (/\.mdx?$/.test(filePath)) {
          const code = await readFile(filePath, "utf-8");
          const { sidebar_icon: sidebarIcon } = matter(code).data;
          const previousIcon = iconMap.get(filePath);

          if (
            (!previousIcon && sidebarIcon) ||
            (previousIcon && !sidebarIcon) ||
            previousIcon !== sidebarIcon
          ) {
            await restart();
          }

          iconMap.set(filePath, sidebarIcon);
        }
      });
    },
    async load(id) {
      if (/\.mdx?$/.test(id)) {
        const code = await readFile(id, "utf-8");
        const { sidebar_icon: sidebarIcon } = matter(code).data;
        iconMap.set(id, sidebarIcon);
      }
    },
  };
};
