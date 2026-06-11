import { stat } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import colors from "picocolors";
import {
  type ConfigEnv,
  runnerImport,
  loadEnv as viteLoadEnv,
  type Plugin as VitePlugin,
} from "vite";
import { logger } from "../cli/common/logger.js";
import { getZudokuRootDir } from "../cli/common/package-json.js";
import {
  resolveExtends,
  runPluginTransformConfig,
} from "../lib/core/transform-config.js";
import invariant from "../lib/util/invariant.js";
import { fileExists } from "./file-exists.js";
import type {
  ResolvedZudokuConfig,
  ZudokuConfig,
} from "./validators/ZudokuConfig.js";
import { validateConfig } from "./validators/ZudokuConfig.js";

export type ConfigWithMeta = ResolvedZudokuConfig & {
  __meta: {
    rootDir: string;
    moduleDir: string;
    configPath: string;
    mode: typeof process.env.ZUDOKU_ENV;
    dependencies: string[];
    /**
     * Module specifiers of all string `extends` entries, resolved and ordered
     * by the depth-first walk of the extends chain. `virtual:zudoku-raw-config`
     * emits a static import per entry and replays the same walk, so layer
     * instances are created in the config module's realm.
     */
    configLayers: string[];
  };
};

// The resolved config lives on globalThis so that external plugins (whose Vite
// plugins import a *different* instance of this module than the CLI's bundled
// one) can read it. A plain module-level `let` is not shared across that
// package boundary; globalThis is, since it's one process.
const configStore = globalThis as { __zudokuConfig?: ConfigWithMeta };
const getConfig = () => configStore.__zudokuConfig;
const setConfig = (next: ConfigWithMeta | undefined) => {
  configStore.__zudokuConfig = next;
};

let envPrefix: string[] | undefined;
let publicEnv: Record<string, string> | undefined;
let modifiedTimes: Map<string, number> | undefined;

const zudokuConfigFiles = [
  "zudoku.config.js",
  "zudoku.config.jsx",
  "zudoku.config.ts",
  "zudoku.config.tsx",
  "zudoku.config.mjs",
];

async function getConfigFilePath(rootDir: string) {
  for (const fileName of zudokuConfigFiles) {
    const filepath = path.join(rootDir, fileName);
    if (await fileExists(filepath)) {
      return filepath;
    }
  }
  throw new Error(`No zudoku config file found in project root.`);
}

// Stub virtual modules so transitive imports don't fail during config loading.
// The real Vite server replaces these with actual values at runtime.
const virtualModuleStubPlugin: VitePlugin = {
  name: "zudoku-virtual-module-stubs",
  resolveId(id) {
    if (id.startsWith("virtual:")) return `\0${id}`;
  },
  load(id) {
    if (id.startsWith("\0virtual:")) return "export default {}";
  },
};

type RawConfigWithMeta = ZudokuConfig & { __meta: ConfigWithMeta["__meta"] };

// Layers must load through the same pipeline as the config itself so raw-TS
// plugin packages and virtual module stubs behave identically.
const importConfigModule = (moduleId: string) =>
  runnerImport<{ default: ZudokuConfig }>(moduleId, {
    plugins: [virtualModuleStubPlugin],
    environments: {
      inline: {
        resolve: {
          // Prevent Node.js from trying to load zudoku's raw .ts source
          // directly, which fails with ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING
          // when --experimental-strip-types is enabled. Uses regex to also
          // catch plugins that re-export from zudoku (e.g. @zuplo/zudoku-plugin-*).
          noExternal: [/zudoku/],
        },
      },
    },
    server: {
      // this allows us to 'load' CSS files in the config
      // see https://github.com/vitejs/vite/pull/19577
      perEnvironmentStartEndDuringDev: true,
    },
  });

const LAYER_EXTENSIONS = ["", ".ts", ".tsx", ".js", ".jsx", ".mjs"];

// Resolves a string `extends` entry like tsconfig does: relative to the file
// that declares it, extension optional. Bare specifiers are left to the module
// runner / Vite resolution; their file path is best-effort for watching.
const resolveLayerPath = async (
  specifier: string,
  containingDir: string | undefined,
  containingPath: string,
): Promise<{ importPath: string; filePath?: string }> => {
  const isRelative = specifier.startsWith("./") || specifier.startsWith("../");

  if (!isRelative && !path.isAbsolute(specifier)) {
    try {
      const require = createRequire(containingPath);
      return { importPath: specifier, filePath: require.resolve(specifier) };
    } catch {
      return { importPath: specifier };
    }
  }

  if (isRelative && !containingDir) {
    throw new Error(
      `Cannot resolve relative config layer "${specifier}" from ${containingPath}: the location of the declaring module is unknown.`,
    );
  }

  const base = isRelative
    ? path.resolve(containingDir ?? "", specifier)
    : specifier;

  for (const extension of LAYER_EXTENSIONS) {
    const candidate = base + extension;
    if (await fileExists(candidate)) {
      return { importPath: candidate, filePath: candidate };
    }
  }

  throw new Error(
    `Config layer "${specifier}" not found (from ${colors.dim(containingPath)}).\nLooked for ${base}{${LAYER_EXTENSIONS.filter(Boolean).join(",")}}. If the layer is generated, run \`zudoku generate\` first.`,
  );
};

type CollectedLayers = { layers: ConfigLayer[]; dependencies: string[] };
type ConfigLayer = { importPath: string; config: ZudokuConfig };

// Walks the `extends` chain depth-first (the exact order `resolveExtends`
// consumes layer modules in) and imports every string entry.
const collectConfigLayers = async (
  config: ZudokuConfig,
  containingDir: string | undefined,
  containingPath: string,
  seen: string[],
  acc: CollectedLayers,
): Promise<void> => {
  if (!config || typeof config !== "object" || !Array.isArray(config.extends))
    return;

  for (const entry of config.extends) {
    if (typeof entry !== "string") {
      // Inline object layers can have string extends of their own; those
      // resolve relative to the file the object was declared in.
      await collectConfigLayers(
        entry,
        containingDir,
        containingPath,
        seen,
        acc,
      );
      continue;
    }

    const { importPath, filePath } = await resolveLayerPath(
      entry,
      containingDir,
      containingPath,
    );
    const layerId = filePath ?? importPath;
    if (seen.includes(layerId)) {
      throw new Error(
        `Circular \`extends\` detected:\n${[...seen, layerId].join(" ->\n")}`,
      );
    }

    let module: { default: ZudokuConfig };
    let dependencies: string[];
    try {
      ({ module, dependencies } = await importConfigModule(importPath));
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Failed to load config layer "${entry}" (from ${colors.dim(containingPath)}):\n${detail}`,
        { cause: error },
      );
    }
    if (module.default === undefined) {
      throw new Error(
        `Config layer "${entry}" (from ${colors.dim(containingPath)}) must have a default export.`,
      );
    }

    acc.layers.push({ importPath, config: module.default });
    acc.dependencies.push(...(filePath ? [filePath] : []), ...dependencies);

    await collectConfigLayers(
      module.default,
      filePath ? path.dirname(filePath) : undefined,
      layerId,
      [...seen, layerId],
      acc,
    );
  }
};

async function loadZudokuConfigWithMeta(
  rootDir: string,
): Promise<RawConfigWithMeta> {
  const configPath = await getConfigFilePath(rootDir);

  let module: { default: ZudokuConfig };
  let dependencies: string[];

  try {
    ({ module, dependencies } = await importConfigModule(configPath));
  } catch (error) {
    // A failed import (bad/missing import, syntax error, throwing top-level
    // code) is not a "missing config file". Surface the underlying cause inline
    // so the user doesn't have to hunt through earlier logs to find it.
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Invalid Zudoku configuration at ${colors.dim(configPath)}:\n\n${detail}`,
      { cause: error },
    );
  }

  // Only treat a genuinely absent default export as missing. A present-but-falsy
  // export (e.g. `export default null`) falls through to validateConfig so it's
  // reported as an invalid configuration rather than a missing one.
  if (module.default === undefined) {
    throw new Error(
      `Invalid Zudoku configuration at ${colors.dim(configPath)}:\n\nConfig file must have a default export.`,
    );
  }

  const collected: CollectedLayers = { layers: [], dependencies: [] };
  try {
    await collectConfigLayers(
      module.default,
      path.dirname(configPath),
      configPath,
      [configPath],
      collected,
    );
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Invalid Zudoku configuration at ${colors.dim(configPath)}:\n\n${detail}`,
      { cause: error },
    );
  }

  return {
    ...resolveExtends(
      module.default,
      collected.layers.map((layer) => layer.config),
    ),
    __meta: {
      rootDir,
      moduleDir: getZudokuRootDir(),
      mode: process.env.ZUDOKU_ENV,
      dependencies: [...dependencies, ...collected.dependencies],
      configLayers: collected.layers.map((layer) => layer.importPath),
      configPath,
    },
  };
}

function loadEnv(configEnv: ConfigEnv, rootDir: string) {
  const envPrefix = ["ZUPLO_PUBLIC_", "ZUDOKU_PUBLIC_"];
  const localEnv = viteLoadEnv(configEnv.mode, rootDir, envPrefix);

  process.env = { ...localEnv, ...process.env };

  const publicEnv = Object.fromEntries(
    Object.entries(process.env)
      .filter(([key]) => envPrefix.some((prefix) => key.startsWith(prefix)))
      .map(([key, value]) => [key, JSON.stringify(value)]),
  );

  return { publicEnv, envPrefix };
}

const isFileSystemPath = (p: string) =>
  !p.startsWith("\0") && !p.includes("virtual:");

async function hasConfigChanged() {
  const config = getConfig();
  if (!config || !modifiedTimes) return true;

  const files = [
    config.__meta.configPath,
    ...config.__meta.dependencies.filter(isFileSystemPath),
  ];

  try {
    const hasChanged = await Promise.all(
      files.map(async (depPath) => {
        const depStat = await stat(depPath);
        const cachedMtime = modifiedTimes?.get(depPath);
        return !cachedMtime || depStat.mtimeMs !== cachedMtime;
      }),
    ).then((results) => results.some(Boolean));

    return hasChanged;
  } catch {
    return true;
  }
}

async function updateModifiedTimes() {
  const config = getConfig();
  if (!config) return;

  const files = [
    config.__meta.configPath,
    ...config.__meta.dependencies.filter(isFileSystemPath),
  ];

  modifiedTimes = new Map();

  await Promise.all(
    files.map(async (depPath) => {
      const depStat = await stat(depPath);
      modifiedTimes?.set(depPath, depStat.mtimeMs);
    }),
  );
}

export const getCurrentConfig = () => {
  const config = getConfig();
  invariant(config, "Config not loaded");
  return config;
};

export const setCurrentConfig = (newConfig: ConfigWithMeta) => {
  setConfig(newConfig);
};

export async function loadZudokuConfig(
  configEnv: ConfigEnv,
  rootDir: string,
): Promise<{
  config: ConfigWithMeta;
  envPrefix: string[];
  publicEnv: Record<string, string>;
}> {
  const shouldReload = await hasConfigChanged();

  const existing = getConfig();
  if (!shouldReload && existing && envPrefix && publicEnv) {
    return { config: existing, envPrefix, publicEnv };
  }

  ({ publicEnv, envPrefix } = loadEnv(configEnv, rootDir));

  try {
    const loadedConfig = await loadZudokuConfigWithMeta(rootDir);
    // Transform first (plugin hooks see the same raw shape as in the client
    // bundle), then parse so schema defaults and transforms apply.
    const transformed = await runPluginTransformConfig(loadedConfig);
    const config: ConfigWithMeta = {
      ...validateConfig(transformed, transformed.__meta.configPath),
      __meta: transformed.__meta,
    };
    setConfig(config);

    logger.info(
      colors.cyan(`loaded config file `) + colors.dim(config.__meta.configPath),
      { timestamp: true },
    );

    return { config, envPrefix, publicEnv };
  } catch (error) {
    const lastValid = getConfig();
    if (lastValid) {
      // Keep serving the last valid config (e.g. during dev reload), but log
      // the error instead of silently swallowing it so the user knows why
      // their latest changes haven't taken effect.
      // Pass the error object via `options.error` so the logger prints the full
      // stack/location of the import or syntax failure, not just the message.
      logger.error(
        colors.red("Failed to reload config, using last valid config."),
        {
          timestamp: true,
          error: error instanceof Error ? error : new Error(String(error)),
        },
      );
      return { config: lastValid, envPrefix, publicEnv };
    }

    // Preserve the original error (and its `cause`) so the branded
    // "Invalid Zudoku configuration" message and stack survive.
    throw error;
  } finally {
    await updateModifiedTimes();
  }
}

export const setStandaloneConfig = (rootDir: string) => {
  setConfig({
    ...validateConfig({}),
    __meta: {
      rootDir,
      moduleDir: getZudokuRootDir(),
      mode: "standalone",
      dependencies: [],
      configLayers: [],
      configPath: "",
    },
  });
};
