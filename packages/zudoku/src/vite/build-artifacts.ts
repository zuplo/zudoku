import fs from "node:fs/promises";
import path from "node:path";
import type {
  BuildArtifact,
  BuildArtifactAlias,
  BuildContributionContext,
  BuildContributions,
  BuildRouteHeaders,
  GetBuildContributions,
  LlmsSection,
  ZudokuPlugin,
} from "../lib/core/plugins.js";
import { isBuildArtifactPlugin } from "../lib/core/plugins.js";

const MANIFEST_SUBPATH = "node_modules/.zudoku/build-contributions.json";

const isGetBuildContributions = (
  value: unknown,
): value is GetBuildContributions => typeof value === "function";

export type BuildContributionManifest = {
  artifacts: Array<Pick<BuildArtifact, "urlPath" | "contentType" | "headers">>;
  aliases: BuildArtifactAlias[];
  routeHeaders: BuildRouteHeaders[];
  llmsSections: LlmsSection[];
};

const normalizeUrlPath = (urlPath: string) => {
  const hasControlCharacter = [...urlPath].some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 0x1f || codePoint === 0x7f;
  });
  const hasUnsafeSegment = urlPath
    .split("/")
    .some(
      (segment) =>
        segment === "." ||
        segment === ".." ||
        /%(?:2e|2f|5c|25|0[0-9a-f]|1[0-9a-f]|7f)/i.test(segment),
    );
  if (
    !urlPath.startsWith("/") ||
    urlPath.startsWith("//") ||
    urlPath.includes("\\") ||
    hasControlCharacter ||
    urlPath.includes("?") ||
    urlPath.includes("#") ||
    (urlPath.length > 1 && urlPath.endsWith("/")) ||
    hasUnsafeSegment
  ) {
    throw new Error(`Unsafe build artifact URL path: ${urlPath}`);
  }

  return urlPath.replace(/\/{2,}/g, "/");
};

type BuildArtifactDevRequest = {
  method?: string;
  url?: string;
};

type BuildArtifactDevResponse = {
  setHeader: (name: string, value: string) => unknown;
  end: (body?: string) => unknown;
};

export const createBuildArtifactDevMiddleware =
  ({
    getContributions,
  }: {
    getContributions: () => Required<BuildContributions>;
  }) =>
  (
    req: BuildArtifactDevRequest,
    res: BuildArtifactDevResponse,
    next: () => unknown,
  ) => {
    if (!req.url || (req.method !== "GET" && req.method !== "HEAD")) {
      return next();
    }

    const requestPath = new URL(req.url, "http://zudoku.local").pathname;
    const contributions = getContributions();
    const alias = contributions.aliases.find(
      (candidate) => candidate.sourcePath === requestPath,
    );
    const artifact = contributions.artifacts.find(
      (candidate) =>
        candidate.urlPath === (alias?.destinationPath ?? requestPath),
    );
    if (!artifact) return next();

    if (artifact.contentType) {
      res.setHeader("Content-Type", artifact.contentType);
    }
    for (const [name, value] of Object.entries(artifact.headers ?? {})) {
      res.setHeader(name, value);
    }
    return res.end(req.method === "HEAD" ? undefined : artifact.content);
  };

const resolveOutputPath = (outputDir: string, urlPath: string) => {
  const outputRoot = path.resolve(outputDir);
  const normalizedPath = normalizeUrlPath(urlPath);
  const outputPath = path.resolve(outputRoot, normalizedPath.slice(1));

  if (!outputPath.startsWith(`${outputRoot}${path.sep}`)) {
    throw new Error(`Unsafe build artifact URL path: ${urlPath}`);
  }

  return outputPath;
};

const mergeHeaders = (
  left: Record<string, string>,
  right: Record<string, string>,
  urlPath: string,
) => {
  const merged = { ...left };

  for (const [name, value] of Object.entries(right)) {
    const existingName = Object.keys(merged).find(
      (key) => key.toLowerCase() === name.toLowerCase(),
    );
    if (!existingName) {
      merged[name] = value;
      continue;
    }

    if (merged[existingName] === value) continue;
    if (name.toLowerCase() === "link" || name.toLowerCase() === "vary") {
      merged[existingName] = `${merged[existingName]}, ${value}`;
      continue;
    }

    throw new Error(
      `Conflicting build response header "${name}" for "${urlPath}"`,
    );
  }

  return merged;
};

export const collectBuildContributions = async (
  plugins: readonly ZudokuPlugin[],
  context: BuildContributionContext,
): Promise<Required<BuildContributions>> => {
  const contributions = await Promise.all(
    plugins.filter(isBuildArtifactPlugin).map(async (plugin) => {
      if (plugin.getBuildContributions) {
        return plugin.getBuildContributions(context);
      }

      if (!plugin.buildContributionsModule) {
        throw new Error("Build artifact plugin has no contribution hook");
      }
      const loadedModule: unknown = await import(
        plugin.buildContributionsModule
      );
      if (
        !loadedModule ||
        typeof loadedModule !== "object" ||
        !("default" in loadedModule) ||
        !isGetBuildContributions(loadedModule.default)
      ) {
        throw new Error(
          `Build contribution module "${plugin.buildContributionsModule}" must have a default function export`,
        );
      }
      return loadedModule.default(context);
    }),
  );

  const artifacts = new Map<string, BuildArtifact>();
  const aliases = new Map<string, BuildArtifactAlias>();
  const routeHeaders = new Map<string, BuildRouteHeaders>();

  for (const contribution of contributions) {
    for (const artifact of contribution.artifacts ?? []) {
      const urlPath = normalizeUrlPath(artifact.urlPath);
      const existing = artifacts.get(urlPath);
      if (existing) {
        throw new Error(
          `Build artifact path "${urlPath}" is contributed more than once`,
        );
      }
      artifacts.set(urlPath, { ...artifact, urlPath });
    }

    for (const alias of contribution.aliases ?? []) {
      const sourcePath = normalizeUrlPath(alias.sourcePath);
      const destinationPath = normalizeUrlPath(alias.destinationPath);
      if (sourcePath === destinationPath) continue;
      if (aliases.has(sourcePath)) {
        throw new Error(
          `Build artifact alias "${sourcePath}" is contributed more than once`,
        );
      }
      aliases.set(sourcePath, { sourcePath, destinationPath });
    }

    for (const route of contribution.routeHeaders ?? []) {
      const urlPath = normalizeUrlPath(route.urlPath);
      const existing = routeHeaders.get(urlPath);
      routeHeaders.set(urlPath, {
        urlPath,
        headers: existing
          ? mergeHeaders(existing.headers, route.headers, urlPath)
          : route.headers,
      });
    }
  }

  for (const alias of aliases.values()) {
    if (artifacts.has(alias.sourcePath)) {
      throw new Error(
        `Build artifact alias "${alias.sourcePath}" conflicts with a contributed artifact at the same path`,
      );
    }
    if (!artifacts.has(alias.destinationPath)) {
      throw new Error(
        `Build artifact alias "${alias.sourcePath}" targets "${alias.destinationPath}", which is not a contributed artifact`,
      );
    }
  }

  return {
    artifacts: [...artifacts.values()],
    aliases: [...aliases.values()],
    routeHeaders: [...routeHeaders.values()],
    llmsSections: contributions.flatMap(
      (contribution) => contribution.llmsSections ?? [],
    ),
    warnings: contributions.flatMap(
      (contribution) => contribution.warnings ?? [],
    ),
  };
};

export const writeBuildArtifacts = async (
  outputDir: string,
  artifacts: readonly BuildArtifact[],
) => {
  const outputs = artifacts.map((artifact) => ({
    artifact,
    outputPath: resolveOutputPath(outputDir, artifact.urlPath),
  }));

  for (const { artifact, outputPath } of outputs) {
    try {
      await fs.lstat(outputPath);
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        continue;
      }
      throw error;
    }

    throw new Error(
      `Cannot write build artifact "${artifact.urlPath}" because an output already exists at "${outputPath}"`,
    );
  }

  await Promise.all(
    outputs.map(async ({ artifact, outputPath }) => {
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, artifact.content, "utf-8");
    }),
  );
};

export const writeBuildContributionManifest = async (
  rootDir: string,
  contributions: Required<BuildContributions>,
) => {
  const manifestPath = path.join(rootDir, MANIFEST_SUBPATH);
  const manifest: BuildContributionManifest = {
    artifacts: contributions.artifacts.map(
      ({ urlPath, contentType, headers }) => ({
        urlPath,
        ...(contentType && { contentType }),
        ...(headers && { headers }),
      }),
    ),
    aliases: contributions.aliases,
    routeHeaders: contributions.routeHeaders,
    llmsSections: contributions.llmsSections,
  };

  await fs.mkdir(path.dirname(manifestPath), { recursive: true });
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
};

export const readBuildContributionManifest = async (
  rootDir: string,
): Promise<BuildContributionManifest> => {
  try {
    return JSON.parse(
      await fs.readFile(path.join(rootDir, MANIFEST_SUBPATH), "utf-8"),
    );
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return { artifacts: [], aliases: [], routeHeaders: [], llmsSections: [] };
    }
    throw error;
  }
};
