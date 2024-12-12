import assert from "node:assert";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { joinPath } from "../lib/util/joinPath.js";
import { LoadedConfig } from "./config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgJsonPath = path.join(__dirname, "../../package.json");

const pkgJson = JSON.parse(await readFile(pkgJsonPath, "utf-8"));

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

export function generateOutput(config: LoadedConfig): Config {
  const routes: Route[] = [];

  if (config.redirects) {
    for (const redirect of config.redirects) {
      routes.push({
        src: joinPath(config.basePath, redirect.from),
        dest: joinPath(config.basePath, redirect.to),
        status: 301,
        headers: { Location: joinPath(config.basePath, redirect.to) },
      });
    }
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
        "Set-Cookie": `__vdpl=${process.env.VERCEL_DEPLOYMENT_ID}; Path=${joinPath(config.basePath)}; SameSite=Strict; Secure; HttpOnly`,
      },
      continue: true,
    });
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

export async function writeOutput(dir: string, config: LoadedConfig) {
  const output = generateOutput(config);
  // For now we are putting this in the dist folder, eventually we can
  // expand this to support the full vercel build output API

  const outputDir = process.env.VERCEL
    ? path.join(dir, ".vercel/output")
    : path.join(dir, "dist/.output");

  await mkdir(outputDir, { recursive: true });
  const outputFile = path.join(outputDir, "config.json");
  await writeFile(outputFile, JSON.stringify(output, null, 2), "utf-8");

  if (process.env.VERCEL) {
    // eslint-disable-next-line no-console
    console.log("Wrote Vercel output to", outputDir);
  }
}
