import matter from "gray-matter";
import dynamicIconImports from "lucide-react/dynamicIconImports.js";
import { readFile } from "node:fs/promises";
import type { Plugin } from "vite";
const lucideIconNames = Object.keys(dynamicIconImports.default);

const matchIconAnnotation = /"icon":\s*"(.*?)"/g;

const toPascalCase = (str: string) =>
  str.replace(/(^\w|-\w)/g, (match) => match.replace("-", "").toUpperCase());

export const replaceSidebarIcons = (code: string) => {
  const collectedIcons = new Set<string>();

  let match;
  while ((match = matchIconAnnotation.exec(code)) !== null) {
    if (!lucideIconNames.includes(match[1])) {
      // eslint-disable-next-line no-console
      console.warn(
        `Invalid icon name "${match[1]}", defaulting to no icon. Check https://lucide.dev/icons for all available icon names.`,
      );
      continue;
    }

    collectedIcons.add(match[1]);
  }

  const importStatement = `import { ${[...collectedIcons].map(toPascalCase).join(", ")} } from "zudoku/icons";`;
  const replacedString = code.replaceAll(
    matchIconAnnotation,
    // The element will be created by the implementers side
    (_, iconName) =>
      `"icon": ${collectedIcons.has(iconName) ? toPascalCase(iconName) : "null"}`,
  );

  return `${importStatement}export const configuredSidebar = ${replacedString};`;
};

// This plugin is responsible to restart the dev server when a sidebar icon is changed inside a markdown file.
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
