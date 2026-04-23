import assert from "node:assert";
import { cp, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getZudokuPackageJson } from "../cli/common/package-json.js";
import type { LoadedConfig } from "../config/config.js";
import { joinUrl } from "../lib/util/joinUrl.js";
import type { RouteRewrite } from "./prerender/utils.js";

const pkgJson = getZudokuPackageJson();

// Generates a Vercel build output file
// https://vercel.com/docs/build-output-api/v3

type Config = {
  version: 3;
  routes?: Route[];
  images?: ImagesConfig;
  wildcard?: WildcardConfig;
  overrides?: OverrideConfig;
  cache?: string[];
  crons?: CronsConfig;
  framework?: Framework;
};

type Route = Source | Handler;

type Source = {
  src: string;
  dest?: string;
  headers?: Record<string, string>;
  methods?: string[];
  continue?: boolean;
  caseSensitive?: boolean;
  check?: boolean;
  status?: number;
  has?: Array<HostHasField | HeaderHasField | CookieHasField | QueryHasField>;
  missing?: Array<
    HostHasField | HeaderHasField | CookieHasField | QueryHasField
  >;
  locale?: Locale;
  middlewareRawSrc?: string[];
  middlewarePath?: string;
};

type Locale = {
  redirect?: Record<string, string>;
  cookie?: string;
};

type HostHasField = {
  type: "host";
  value: string;
};

type HeaderHasField = {
  type: "header";
  key: string;
  value?: string;
};

type CookieHasField = {
  type: "cookie";
  key: string;
  value?: string;
};

type QueryHasField = {
  type: "query";
  key: string;
  value?: string;
};

type HandleValue =
  | "rewrite"
  | "filesystem" // check matches after the filesystem misses
  | "resource"
  | "miss" // check matches after every filesystem miss
  | "hit"
  | "error"; //  check matches after error (500, 404, etc.)

type Handler = {
  handle: HandleValue;
  src?: string;
  dest?: string;
  status?: number;
};
type ImageFormat = "image/avif" | "image/webp";

type RemotePattern = {
  protocol?: "http" | "https";
  hostname: string;
  port?: string;
  pathname?: string;
  search?: string;
};

type LocalPattern = {
  pathname?: string;
  search?: string;
};

type ImagesConfig = {
  sizes: number[];
  domains: string[];
  remotePatterns?: RemotePattern[];
  localPatterns?: LocalPattern[];
  minimumCacheTTL?: number; // seconds
  formats?: ImageFormat[];
  dangerouslyAllowSVG?: boolean;
  contentSecurityPolicy?: string;
  contentDispositionType?: string;
};

type WildCard = {
  domain: string;
  value: string;
};

type WildcardConfig = Array<WildCard>;

type Override = {
  path?: string;
  contentType?: string;
};

type OverrideConfig = Record<string, Override>;

type Framework = {
  version: string;
};

type Cron = {
  path: string;
  schedule: string;
};

type CronsConfig = Cron[];

export function generateOutput({
  config,
  redirects,
  rewrites = [],
}: {
  config: LoadedConfig;
  redirects: Array<{ from: string; to: string }>;
  rewrites?: RouteRewrite[];
}): Config {
  const routes: Route[] = [];

  for (const redirect of redirects) {
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

  if (rewrites.length > 0) {
    routes.push({ handle: "filesystem" });
    for (const rewrite of rewrites) {
      routes.push({
        src: joinUrl(config.basePath, rewrite.source),
        dest: joinUrl(config.basePath, rewrite.destination),
      });
    }
  }

  const output: Config = {
    version: 3,
    framework: {
      version: pkgJson.version,
    },
    routes,
  };

  return output;
}

export async function writeOutput(
  dir: string,
  {
    config,
    redirects,
    rewrites,
  }: {
    config: LoadedConfig;
    redirects: Array<{ from: string; to: string }>;
    rewrites?: RouteRewrite[];
  },
) {
  const output = generateOutput({ config, redirects, rewrites });
  // For now we are putting this in the dist folder, eventually we can
  // expand this to support the full vercel build output API

  const outputDir = process.env.VERCEL
    ? path.join(dir, ".vercel/output")
    : path.join(dir, "dist/.output");

  await mkdir(outputDir, { recursive: true });
  const outputFile = path.join(outputDir, "config.json");
  await writeFile(outputFile, JSON.stringify(output, null, 2), "utf-8");

  if (process.env.VERCEL) {
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
