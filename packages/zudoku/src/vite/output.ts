import assert from "node:assert";
import { existsSync } from "node:fs";
import { cp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { getZudokuPackageJson } from "../cli/common/package-json.js";
import type { LoadedConfig } from "../config/config.js";
import invariant from "../lib/util/invariant.js";
import { joinUrl } from "../lib/util/joinUrl.js";
import {
  readBuildContributionManifest,
  type BuildContributionManifest,
} from "./build-artifacts.js";
import type { RouteRewrite } from "./prerender/utils.js";
import {
  generateVercelMarkdownMiddleware,
  type GenerateVercelMarkdownMiddlewareOptions,
} from "./vercel-markdown-middleware.js";

const pkgJson = getZudokuPackageJson();
const MARKDOWN_MIDDLEWARE_PATH = "zudoku-markdown";
const HTML_EXTENSION = ".html";

const CLEAN_URL_ROUTES: Route[] = [
  {
    src: "^/(?:(.+)/)?index(?:\\.html)?/?$",
    headers: { Location: "/$1" },
    status: 308,
  },
  {
    src: "^/(.*)\\.html/?$",
    headers: { Location: "/$1" },
    status: 308,
  },
];

export type MarkdownNegotiationOutput = Omit<
  GenerateVercelMarkdownMiddlewareOptions,
  "basePath"
>;

const listStaticFiles = async (
  rootDir: string,
  currentDir = rootDir,
): Promise<string[]> => {
  if (!existsSync(currentDir)) return [];

  const entries = await readdir(currentDir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        return listStaticFiles(rootDir, entryPath);
      }
      if (!entry.isFile()) return [];

      return [path.relative(rootDir, entryPath).split(path.sep).join("/")];
    }),
  );

  return files.flat().sort();
};

const getCleanPath = (filename: string) => {
  const pathWithoutExtension = filename.slice(0, -HTML_EXTENSION.length);
  if (pathWithoutExtension === "index") return "";
  if (pathWithoutExtension.endsWith("/index")) {
    return pathWithoutExtension.slice(0, -"/index".length);
  }
  return pathWithoutExtension;
};

const getCleanUrlOverrides = (
  staticHtmlFiles: readonly string[],
): OverrideConfig => {
  const sourceByCleanPath = new Map<string, string>();

  return Object.fromEntries(
    staticHtmlFiles.map((filename) => {
      const cleanPath = getCleanPath(filename);
      const existingSource = sourceByCleanPath.get(cleanPath);
      invariant(
        !existingSource || existingSource === filename,
        `Cannot generate the Vercel clean URL "${cleanPath}" for both "${existingSource}" and "${filename}"`,
      );
      sourceByCleanPath.set(cleanPath, filename);
      return [filename, { path: cleanPath }];
    }),
  );
};

const getMiddlewareRouteHeaderPaths = (
  config: LoadedConfig,
  markdownNegotiation?: MarkdownNegotiationOutput,
) =>
  new Set(
    markdownNegotiation?.knownCanonicalRoutePaths.map((routePath) =>
      joinUrl(config.basePath, routePath),
    ) ?? [],
  );

export const cleanVercelOutput = async (dir: string) => {
  if (!process.env.VERCEL) return;
  await rm(path.join(dir, ".vercel/output"), {
    recursive: true,
    force: true,
  });
};

// The subset of Vercel Build Output API v3 configuration emitted by Zudoku.
// https://vercel.com/docs/build-output-api/configuration

type Config = {
  version: 3;
  routes: Route[];
  overrides?: OverrideConfig;
  framework: { version: string };
};

type Route = Source | Handler;

type Source = {
  src: string;
  dest?: string;
  headers?: Record<string, string>;
  methods?: string[];
  continue?: boolean;
  status?: number;
  has?: HeaderHasField[];
  middlewarePath?: string;
};

type HeaderHasField = {
  type: "header";
  key: string;
  value?: string;
};

type Handler = {
  handle: "filesystem";
};

type Override = {
  path?: string;
  contentType?: string;
};

type OverrideConfig = Record<string, Override>;

const mergeResponseHeaders = (
  base: Record<string, string>,
  contributed: Record<string, string>,
) => {
  const merged = { ...base };
  for (const [name, value] of Object.entries(contributed)) {
    const existingName = Object.keys(merged).find(
      (candidate) => candidate.toLowerCase() === name.toLowerCase(),
    );
    if (!existingName) {
      merged[name] = value;
      continue;
    }
    if (merged[existingName] === value) continue;
    if (["link", "vary"].includes(name.toLowerCase())) {
      merged[existingName] = `${merged[existingName]}, ${value}`;
      continue;
    }
    throw new Error(
      `Conflicting response header "${name}" for a generated redirect`,
    );
  }
  return merged;
};

export function generateOutput({
  config,
  redirects,
  rewrites = [],
  markdownNegotiation,
  staticHtmlFiles = [],
  artifacts = [],
  aliases = [],
  routeHeaders = [],
}: {
  config: LoadedConfig;
  redirects: Array<{ from: string; to: string }>;
  rewrites?: RouteRewrite[];
  markdownNegotiation?: MarkdownNegotiationOutput;
  staticHtmlFiles?: readonly string[];
  artifacts?: BuildContributionManifest["artifacts"];
  aliases?: BuildContributionManifest["aliases"];
  routeHeaders?: BuildContributionManifest["routeHeaders"];
}): Config {
  const routes: Route[] = [];
  const middlewareRouteHeaderPaths = getMiddlewareRouteHeaderPaths(
    config,
    markdownNegotiation,
  );

  const contributedSources = new Set([
    ...artifacts.map((artifact) => artifact.urlPath.replace(/\/$/, "")),
    ...aliases.map((alias) => alias.sourcePath.replace(/\/$/, "")),
  ]);
  const configuredSources = [
    ...redirects.map((redirect) => ({
      kind: "redirect",
      source: redirect.from,
    })),
    ...rewrites.map((rewrite) => ({
      kind: "rewrite",
      source: joinUrl(config.basePath, rewrite.source),
    })),
  ];
  for (const { kind, source } of configuredSources) {
    if (!contributedSources.has(source.replace(/\/$/, ""))) continue;
    throw new Error(
      `Build artifact route "${source}" conflicts with a configured ${kind} source`,
    );
  }

  if (staticHtmlFiles.length > 0) {
    routes.push(...CLEAN_URL_ROUTES);
  }

  const uniqueRedirects = [
    ...new Map(
      redirects.map((redirect) => [
        JSON.stringify([redirect.from, redirect.to]),
        redirect,
      ]),
    ).values(),
  ];
  const redirectHeaderPaths = new Set<string>();
  for (const redirect of uniqueRedirects) {
    const contributedHeaders = routeHeaders.find(
      (route) => route.urlPath === redirect.from,
    )?.headers;
    if (contributedHeaders) redirectHeaderPaths.add(redirect.from);
    routes.push({
      src: redirect.from,
      dest: redirect.to,
      status: 301,
      headers: contributedHeaders
        ? mergeResponseHeaders({ Location: redirect.to }, contributedHeaders)
        : { Location: redirect.to },
    });
  }

  if (process.env.VERCEL_SKEW_PROTECTION_ENABLED) {
    assert(process.env.VERCEL_DEPLOYMENT_ID);

    routes.push({
      src: "/.*",
      has: [
        {
          type: "header",
          key: "Sec-Fetch-Dest",
          value: "document",
        },
      ],
      headers: {
        "Set-Cookie": `__vdpl=${process.env.VERCEL_DEPLOYMENT_ID}; Path=${joinUrl(config.basePath)}; SameSite=Strict; Secure; HttpOnly`,
      },
      continue: true,
    });
  }

  const escapeRoutePath = (value: string) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const exactRoute = (value: string) =>
    value === "/" ? "^/$" : `^${escapeRoutePath(value)}/?$`;

  for (const artifact of artifacts) {
    const headers = {
      ...(artifact.contentType && { "Content-Type": artifact.contentType }),
      ...artifact.headers,
    };
    if (Object.keys(headers).length === 0) continue;
    routes.push({
      src: exactRoute(artifact.urlPath),
      methods: ["GET", "HEAD"],
      headers,
      continue: true,
    });
  }

  for (const route of routeHeaders) {
    if (
      middlewareRouteHeaderPaths.has(route.urlPath) ||
      redirectHeaderPaths.has(route.urlPath)
    ) {
      continue;
    }
    routes.push({
      src: exactRoute(route.urlPath),
      methods: ["GET", "HEAD"],
      headers: route.headers,
      continue: true,
    });
  }

  for (const alias of aliases) {
    const target = artifacts.find(
      (artifact) => artifact.urlPath === alias.destinationPath,
    );
    routes.push({
      src: exactRoute(alias.sourcePath),
      dest: alias.destinationPath,
      methods: ["GET", "HEAD"],
      ...(target && {
        headers: {
          ...(target.contentType && { "Content-Type": target.contentType }),
          ...target.headers,
        },
      }),
    });
  }

  if (markdownNegotiation) {
    const basePath = joinUrl(config.basePath);
    const escapedBasePath = basePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    routes.push({
      // Keep the path matcher broad because valid documentation slugs can end
      // in dotted versions such as `/api/1.0.0`. The middleware itself
      // cheaply passes through assets and non-document routes.
      src: basePath === "/" ? "/(.*)" : `${escapedBasePath}(?:/(.*))?`,
      methods: ["GET", "HEAD"],
      middlewarePath: MARKDOWN_MIDDLEWARE_PATH,
      continue: true,
    });
  }

  if (rewrites.length > 0) {
    routes.push({ handle: "filesystem" });
    for (const rewrite of rewrites) {
      routes.push({
        src: joinUrl(config.basePath, rewrite.source),
        dest: joinUrl(config.basePath, rewrite.destination),
      });
    }
  }

  const overrides = {
    ...getCleanUrlOverrides(staticHtmlFiles),
    ...Object.fromEntries(
      artifacts.flatMap((artifact) =>
        artifact.contentType
          ? [
              [
                artifact.urlPath.replace(/^\/+/, ""),
                { contentType: artifact.contentType },
              ],
            ]
          : [],
      ),
    ),
  };

  const output: Config = {
    version: 3,
    framework: {
      version: pkgJson.version,
    },
    routes,
    ...(Object.keys(overrides).length > 0 && { overrides }),
  };

  return output;
}

export async function writeOutput(
  dir: string,
  {
    config,
    redirects,
    rewrites,
    markdownNegotiation,
  }: {
    config: LoadedConfig;
    redirects: Array<{ from: string; to: string }>;
    rewrites?: RouteRewrite[];
    markdownNegotiation?: MarkdownNegotiationOutput;
  },
) {
  const buildContributions = await readBuildContributionManifest(dir);
  const vercelMarkdownNegotiation = process.env.VERCEL
    ? markdownNegotiation
    : undefined;
  const staticFiles = process.env.VERCEL
    ? await listStaticFiles(path.join(dir, ".vercel/output/static"))
    : [];
  const staticHtmlFiles = staticFiles.filter((filename) =>
    filename.endsWith(HTML_EXTENSION),
  );
  const staticPaths = new Set(staticFiles.map((filename) => `/${filename}`));
  const cleanStaticPaths = new Set(
    staticHtmlFiles.map((filename) => `/${getCleanPath(filename)}`),
  );
  for (const contribution of [
    ...buildContributions.artifacts.map((artifact) => ({
      kind: "artifact",
      urlPath: artifact.urlPath,
    })),
    ...buildContributions.aliases.map((alias) => ({
      kind: "alias",
      urlPath: alias.sourcePath,
    })),
  ]) {
    if (!cleanStaticPaths.has(contribution.urlPath)) continue;
    throw new Error(
      `Build artifact ${contribution.kind} "${contribution.urlPath}" conflicts with an existing clean URL output`,
    );
  }
  for (const alias of buildContributions.aliases) {
    if (!staticPaths.has(alias.sourcePath.replace(/\/$/, ""))) continue;
    throw new Error(
      `Build artifact alias "${alias.sourcePath}" conflicts with an existing static output`,
    );
  }
  const staticPassthroughPaths = staticFiles
    .filter((filename) => {
      const basename = path.posix.basename(filename);
      return (
        !basename.includes(".") ||
        basename.endsWith(".md") ||
        basename.endsWith(".mdx")
      );
    })
    .map((filename) => `/${filename}`);
  staticPassthroughPaths.push(
    ...buildContributions.artifacts.map((artifact) => artifact.urlPath),
    ...buildContributions.aliases.map((alias) => alias.sourcePath),
  );
  const output = generateOutput({
    config,
    redirects,
    rewrites,
    markdownNegotiation: vercelMarkdownNegotiation,
    staticHtmlFiles,
    artifacts: buildContributions.artifacts,
    aliases: buildContributions.aliases,
    routeHeaders: buildContributions.routeHeaders,
  });
  const middlewareRouteHeaderPaths = getMiddlewareRouteHeaderPaths(
    config,
    vercelMarkdownNegotiation,
  );
  const middlewareRouteHeaders = buildContributions.routeHeaders.filter(
    (route) => middlewareRouteHeaderPaths.has(route.urlPath),
  );

  const outputDir = process.env.VERCEL
    ? path.join(dir, ".vercel/output")
    : path.join(dir, "dist/.output");

  await mkdir(outputDir, { recursive: true });
  const outputFile = path.join(outputDir, "config.json");
  await writeFile(outputFile, JSON.stringify(output, null, 2), "utf-8");

  if (process.env.VERCEL) {
    if (vercelMarkdownNegotiation) {
      const functionDir = path.join(
        outputDir,
        "functions",
        `${MARKDOWN_MIDDLEWARE_PATH}.func`,
      );
      await mkdir(functionDir, { recursive: true });
      await Promise.all([
        writeFile(
          path.join(functionDir, "index.js"),
          generateVercelMarkdownMiddleware({
            basePath: config.basePath,
            ...vercelMarkdownNegotiation,
            passthroughPaths: staticPassthroughPaths,
            routeHeaders: middlewareRouteHeaders,
          }),
          "utf-8",
        ),
        writeFile(
          path.join(functionDir, ".vc-config.json"),
          JSON.stringify({ runtime: "edge", entrypoint: "index.js" }, null, 2),
          "utf-8",
        ),
      ]);
    }

    // biome-ignore lint/suspicious/noConsole: Logging allowed here
    console.log("Wrote Vercel output to", outputDir);
  }
}

export async function writeVercelSSROutput(dir: string, serverOutDir: string) {
  // https://vercel.com/docs/build-output-api
  const outputDir = path.join(dir, ".vercel/output");

  const distDir = path.join(dir, "dist");
  await cp(distDir, path.join(outputDir, "static"), {
    recursive: true,
    filter: (src) =>
      !path.relative(distDir, src).split(path.sep).includes("server"),
  });

  const funcDir = path.join(outputDir, "functions/render.func");
  await mkdir(funcDir, { recursive: true });
  await cp(serverOutDir, funcDir, { recursive: true });

  // Write .vc-config.json for the edge function (see https://vercel.com/docs/build-output-api/primitives#edge-functions)
  await writeFile(
    path.join(funcDir, ".vc-config.json"),
    JSON.stringify({ runtime: "edge", entrypoint: "entry.js" }),
  );

  await writeFile(
    path.join(outputDir, "config.json"),
    JSON.stringify({
      version: 3,
      framework: { version: pkgJson.version },
      routes: [{ handle: "filesystem" }, { src: "/(.*)", dest: "/render" }],
    }),
  );

  // biome-ignore lint/suspicious/noConsole: Logging allowed here
  console.log("Wrote Vercel SSR output to", outputDir);
}
