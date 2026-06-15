import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { IconifyIcon, IconifyJSON } from "@iconify/types";
import { getIconData } from "@iconify/utils";
import { parseSync, Visitor } from "oxc-parser";
import type { ObjectProperty } from "oxc-parser";
import colors from "picocolors";
import type { Plugin } from "vite";
import { getCurrentConfig } from "../config/loader.js";
import { IconNames } from "../config/validators/icon-types.js";
import {
  ICON_VIRTUAL_PREFIX,
  isIconNameShape,
  parseIconName,
} from "../lib/util/iconName.js";
import { IconRegistry } from "./icon-registry.js";

const resolvedPrefix = `\0${ICON_VIRTUAL_PREFIX}`;
const lucideNames = new Set<string>(IconNames);

const iconSetCache = new Map<string, IconifyJSON | null>();

const loadIconSet = (prefix: string, rootDir: string): IconifyJSON | null => {
  const cached = iconSetCache.get(prefix);
  if (cached !== undefined) return cached;

  const spec = `@iconify-json/${prefix}/icons.json`;
  // Resolve from the user's project first (user-installed sets), then fall back to
  // zudoku's own deps (lucide is a direct dependency, so it always resolves).
  const requirers = [
    createRequire(pathToFileURL(path.join(rootDir, "package.json")).href),
    createRequire(import.meta.url),
  ];

  let set: IconifyJSON | null = null;
  for (const require of requirers) {
    try {
      set = require(spec) as IconifyJSON;
      break;
    } catch {
      // try next requirer
    }
  }
  iconSetCache.set(prefix, set);

  return set;
};

const resolveIconData = (
  rawName: string,
  rootDir: string,
): IconifyIcon | null => {
  const { prefix, name } = parseIconName(rawName);
  const set = loadIconSet(prefix, rootDir);
  if (!set) return null;
  return getIconData(set, name);
};

const staticKeyName = (key: ObjectProperty["key"]) => {
  if (key.type === "Identifier") return key.name;
  if (key.type === "Literal" && typeof key.value === "string") return key.value;
};

// Exported for unit testing.
export const collectIconLiterals = (code: string, id: string) => {
  const found = new Set<string>();
  try {
    const { program } = parseSync(id, code);
    new Visitor({
      Property(node) {
        if (node.computed || staticKeyName(node.key) !== "icon") return;

        const { value } = node;
        if (value.type !== "Literal" || typeof value.value !== "string") return;

        const raw = value.value;
        if (
          isIconNameShape(raw) &&
          (raw.includes(":") || lucideNames.has(raw))
        ) {
          found.add(raw);
        }
      },
    }).visit(program);
  } catch {
    return found;
  }
  return found;
};

/**
 * Resolves icon name strings to inline icon data at build time.
 *
 * - Serves a per-icon virtual module `virtual:zudoku-icon/<prefix>/<name>` that
 *   registers the icon via `addIcon()`. Rollup dedupes + code-splits these, so only
 *   icons reachable from a route ship in its chunk.
 * - A `post` transform scans `icon: "..."` literals (incl. compiled `<Icon>` JSX) and
 *   appends the matching virtual side-effect imports, so authored icons inline + SSR
 *   cleanly without a runtime API fetch.
 */
export const viteIconsPlugin = (): Plugin => {
  const getRootDir = () => getCurrentConfig().__meta.rootDir;

  return {
    name: "zudoku-icons-plugin",
    enforce: "post",
    resolveId: {
      filter: { id: /^virtual:zudoku-icon\// },
      handler: (id) => `\0${id}`,
    },
    load: {
      filter: { id: /^\0virtual:zudoku-icon\// },
      handler(id) {
        const iconId = id.slice(resolvedPrefix.length).replace("/", ":");
        const data = resolveIconData(iconId, getRootDir());

        if (!data) {
          const { prefix } = parseIconName(iconId);
          this.warn(
            `Icon "${iconId}" could not be resolved at build time. Install ${colors.cyan(
              `@iconify-json/${prefix}`,
            )} to inline it, or it will be fetched at runtime (dev) / blank (prod).`,
          );
          return `export {};`;
        }

        // Use the public `zudoku/icons` entry so virtual modules and renderers
        // share registry state without coupling this plugin to an internal path.
        return [
          `import { addIcon } from "zudoku/icons";`,
          `addIcon(${JSON.stringify(iconId)}, ${JSON.stringify(data)});`,
        ].join("\n");
      },
    },
    transform: {
      filter: {
        id: {
          include: /\.(?:[cm]?[jt]sx?|mdx)(?:\?|$)/,
          exclude: /\/node_modules\//,
        },
        code: { include: "icon" },
      },
      handler(code, id) {
        const icons = collectIconLiterals(code, id);
        if (icons.size === 0) return;

        // Appended (not prepended): ESM hoists import declarations, so the addIcon
        // side-effects still run before the module body — and source maps stay valid.
        const imports = new IconRegistry(icons).toImports();
        return { code: `${code}\n${imports}`, map: null };
      },
    },
  };
};

export default viteIconsPlugin;
