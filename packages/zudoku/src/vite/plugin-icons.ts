import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { IconifyJSON } from "@iconify/types";
import { getIconData } from "@iconify/utils";
import { parseSync, Visitor } from "oxc-parser";
import type { ObjectProperty } from "oxc-parser";
import colors from "picocolors";
import { normalizePath, type Plugin } from "vite";
import { getCurrentConfig } from "../config/loader.js";
import { IconNames } from "../config/validators/icon-types.js";
import {
  ICON_VIRTUAL_PREFIX,
  isIconNameShape,
  parseIconVirtualId,
} from "../lib/util/iconName.js";
import { IconRegistry } from "./icon-registry.js";

const lucideNames = new Set<string>(IconNames);

// The vite entry always sits at `<zudoku>/{src,dist}/vite/`, so two levels up is the package root
const zudokuPackageRoot = normalizePath(
  fileURLToPath(new URL("../../", import.meta.url)),
);

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Exclude dependencies from scanning, but keep Zudoku's own source so built-in icons register.
export const buildDependencyExclude = (packageRoot: string): RegExp =>
  new RegExp(`^(?!${escapeRegExp(packageRoot)}).*/node_modules/`);

const dependencyExclude = buildDependencyExclude(zudokuPackageRoot);
const iconSetCache = new Map<string, IconifyJSON>();

const isModuleNotFound = (err: unknown): boolean =>
  typeof err === "object" &&
  err !== null &&
  "code" in err &&
  (err.code === "MODULE_NOT_FOUND" || err.code === "ERR_MODULE_NOT_FOUND");

const loadIconSet = (prefix: string, rootDir: string): IconifyJSON | null => {
  const cacheKey = `${rootDir}\0${prefix}`;
  const cached = iconSetCache.get(cacheKey);
  if (cached) return cached;

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
    } catch (err) {
      // "Not installed" is the expected miss — try the next requirer. Any other
      // error (corrupt/malformed package) is a real problem, so surface it.
      if (!isModuleNotFound(err)) throw err;
    }
  }
  if (set) iconSetCache.set(cacheKey, set);

  return set;
};

const staticKeyName = (key: ObjectProperty["key"]): string | undefined => {
  if (key.type === "Identifier") return key.name;
  if (key.type === "Literal" && typeof key.value === "string") return key.value;
  return undefined;
};

// Exported for unit testing. Only collects literal `icon: "..."` properties (the shape
// compiled `<Icon icon="..." />` JSX takes post-react-transform); icons passed via a
// variable, spread, or a differently-named prop aren't inlined at build time.
// `warn` (optional) reports scan/parse failures.
export const collectIconLiterals = (
  code: string,
  id: string,
  warn?: (message: string) => void,
) => {
  const found = new Set<string>();
  try {
    // parseSync reports syntax errors on `errors` instead of throwing, and a parse error can
    // truncate `program` and drop icons — surface it (the catch only fires on other errors).
    const { program, errors } = parseSync(id, code);
    if (errors.length > 0) {
      warn?.(
        `Could not fully parse ${id} for icons (${errors.length} syntax error(s)); some icons may not be inlined.`,
      );
    }
    new Visitor({
      Property(node) {
        if (node.computed || staticKeyName(node.key) !== "icon") return;

        const { value } = node;
        if (value.type !== "Literal" || typeof value.value !== "string") return;

        const raw = value.value;
        if (!isIconNameShape(raw)) return;

        // A bare, icon-shaped non-lucide name (e.g. a cva `icon: "size-8"` variant) is
        // almost never a Zudoku icon — skip it silently rather than warn on every `icon:`.
        if (raw.includes(":") || lucideNames.has(raw)) {
          found.add(raw);
        }
      },
    }).visit(program);
  } catch (err) {
    warn?.(`Failed to scan ${id} for icons: ${err}`);
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
      filter: { id: new RegExp(`^${ICON_VIRTUAL_PREFIX}`) },
      handler: (id) => `\0${id}`,
    },
    load: {
      filter: { id: new RegExp(`^\\0${ICON_VIRTUAL_PREFIX}`) },
      handler(id) {
        // Strip the leading `\0` rollup adds to resolved virtual ids, then decode.
        const {
          prefix,
          name,
          id: iconId,
        } = parseIconVirtualId(id.replace(/^\0/, ""));
        const set = loadIconSet(prefix, getRootDir());
        const pkg = colors.cyan(`@iconify-json/${prefix}`);

        if (!set) {
          this.warn(
            `Icon "${iconId}" could not be resolved at build time. Install ${pkg} to inline it, or it will be fetched at runtime (dev) / render the missing-icon fallback (prod).`,
          );
          return `export {};`;
        }

        const data = getIconData(set, name);
        if (!data) {
          this.warn(
            `Icon "${iconId}" was not found in the installed ${pkg} set. Check the name; it will be fetched at runtime (dev) / render the missing-icon fallback (prod).`,
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
          exclude: dependencyExclude,
        },
        code: { include: "icon" },
      },
      handler(code, id) {
        const icons = collectIconLiterals(code, id, (message) =>
          this.warn(message),
        );
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
