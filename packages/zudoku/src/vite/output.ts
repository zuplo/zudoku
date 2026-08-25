import assert from "node:assert";
import { existsSync } from "node:fs";
import { cp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { getZudokuPackageJson } from "../cli/common/package-json.js";
import type { LoadedConfig } from "../config/config.js";
import invariant from "../lib/util/invariant.js";
import { joinUrl } from "../lib/util/joinUrl.js";
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
  path: string;
};

type OverrideConfig = Record<string, Override>;

export function generateOutput({
  config,
  redirects,
  rewrites = [],
  markdownNegotiation,
  staticHtmlFiles = [],
}: {
  config: LoadedConfig;
  redirects: Array<{ from: string; to: string }>;
  rewrites?: RouteRewrite[];
  markdownNegotiation?: MarkdownNegotiationOutput;
  staticHtmlFiles?: readonly string[];
}): Config {
  const routes: Route[] = [];

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
  for (const redirect of uniqueRedirects) {
    routes.push({
      src: redirect.from,
      dest: redirect.to,
      status: 301,
      headers: { Location: redirect.to },
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

  const overrides = getCleanUrlOverrides(staticHtmlFiles);

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
  const vercelMarkdownNegotiation = process.env.VERCEL
    ? markdownNegotiation
    : undefined;
  const staticFiles = process.env.VERCEL
    ? await listStaticFiles(path.join(dir, ".vercel/output/static"))
    : [];
  const staticHtmlFiles = staticFiles.filter((filename) =>
    filename.endsWith(HTML_EXTENSION),
  );
  const extensionlessStaticPaths = staticFiles
    .filter((filename) => !path.posix.basename(filename).includes("."))
    .map((filename) => `/${filename}`);
  const output = generateOutput({
    config,
    redirects,
    rewrites,
    markdownNegotiation: vercelMarkdownNegotiation,
    staticHtmlFiles,
  });

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
            passthroughPaths: extensionlessStaticPaths,
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
