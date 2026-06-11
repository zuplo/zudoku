import fs from "node:fs/promises";
import path from "node:path";
import colors from "picocolors";
import { runnerImport } from "vite";
import { ZuploEnv } from "../../app/env.js";
import { logger } from "../../cli/common/logger.js";
import { resolveZuploPackage, ZUPLO_PACKAGE_NAME } from "../../vite/zuplo.js";
import { fileExists } from "../file-exists.js";
import { generateConfigSource } from "./codegen.js";
import { validateSpec, type ZudokuSpec } from "./schema.js";

export const DEFAULT_SPEC_FILE = "spec.json";
export const DEFAULT_OUTPUT_FILE = "zudoku.base.ts";

export type GenerateBaseConfigOptions = {
  /** The project root directory */
  dir: string;
  /** Spec file path (relative to dir). Must exist when set explicitly. */
  specPath?: string;
  /** Output file path (relative to dir) */
  outputPath?: string;
};

export type GenerateBaseConfigResult = {
  outputPath: string;
  specPath?: string;
  written: boolean;
};

const loadSpec = async (
  dir: string,
  specPath?: string,
): Promise<{ spec: ZudokuSpec; specPath?: string }> => {
  const resolved = path.resolve(dir, specPath ?? DEFAULT_SPEC_FILE);

  if (!(await fileExists(resolved))) {
    if (specPath) throw new Error(`Spec file not found at ${resolved}`);
    return { spec: {} };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(await fs.readFile(resolved, "utf-8"));
  } catch (error) {
    throw new Error(`Could not parse spec file at ${resolved}: ${error}`, {
      cause: error,
    });
  }

  return { spec: validateSpec(parsed, resolved), specPath: resolved };
};

// Integrations can contribute spec entries via an `extendSpec` export (e.g.
// @zudoku/zuplo adds the OpenAPI files and GraphQL endpoints it detects in
// the surrounding Zuplo project). Resolved from the user's project so core
// stays free of integration specifics.
const applySpecExtensions = async (
  spec: ZudokuSpec,
  dir: string,
): Promise<ZudokuSpec> => {
  const entryPath = resolveZuploPackage(dir, "node");
  if (!entryPath) {
    if (ZuploEnv.isZuplo) {
      logger.warn(
        colors.yellow(
          `Zuplo mode is enabled, but ${ZUPLO_PACKAGE_NAME} is not installed. ` +
            `Install it in your dev portal project to generate the Zuplo-specific configuration.`,
        ),
        { timestamp: true },
      );
    }
    return spec;
  }

  const { module } = await runnerImport<{
    extendSpec?: (
      spec: ZudokuSpec,
      options: { rootDir: string },
    ) => Promise<ZudokuSpec>;
  }>(entryPath, {
    environments: {
      inline: { resolve: { noExternal: [/zudoku/] } },
    },
  });

  if (!module.extendSpec) return spec;

  return await module.extendSpec(spec, { rootDir: dir });
};

/**
 * Compiles a spec file (and any detected integration context, e.g. a Zuplo
 * project) into a typed base config layer the user's `zudoku.config.ts`
 * extends. The output is only rewritten when its content changed so watchers
 * don't reload needlessly.
 */
export const generateBaseConfig = async ({
  dir,
  specPath,
  outputPath = DEFAULT_OUTPUT_FILE,
}: GenerateBaseConfigOptions): Promise<GenerateBaseConfigResult> => {
  const loaded = await loadSpec(dir, specPath);
  const spec = await applySpecExtensions(loaded.spec, dir);

  const resolvedOutput = path.resolve(dir, outputPath);
  const source = generateConfigSource(spec, {
    specFile: loaded.specPath
      ? path.relative(path.dirname(resolvedOutput), loaded.specPath)
      : undefined,
  });

  const existing = await fs
    .readFile(resolvedOutput, "utf-8")
    .catch(() => undefined);
  const written = existing !== source;
  if (written) await fs.writeFile(resolvedOutput, source);

  return { outputPath: resolvedOutput, specPath: loaded.specPath, written };
};

/**
 * Runs the generate step ahead of dev/build/preview ("compile the spec to a
 * base config every time before the real build"): generates when a
 * `spec.json` is present or the project runs in Zuplo mode, and is a no-op
 * otherwise.
 */
export const maybeGenerateBaseConfig = async (dir: string) => {
  const hasSpec = await fileExists(path.join(dir, DEFAULT_SPEC_FILE));
  if (!hasSpec && !ZuploEnv.isZuplo) return;

  const result = await generateBaseConfig({ dir });

  const source = result.specPath
    ? path.basename(result.specPath)
    : "Zuplo project";
  logger.info(
    colors.cyan(`generated base config `) +
      colors.dim(`${result.outputPath} (from ${source})`),
    { timestamp: true },
  );

  return result;
};
