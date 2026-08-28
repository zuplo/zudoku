import fs from "node:fs/promises";
import path from "node:path";
import { stringify as stringifyYaml } from "yaml";
import type { OpenAPIDocument } from "../../lib/oas/parser/index.js";

export type OpenApiPublication = {
  apiPath: string;
  urlPath: string;
  content: string;
  mediaType: "application/json" | "application/yaml";
};

const getExtension = (urlPath: string) =>
  path.posix.extname(urlPath).toLowerCase();

export const getOpenApiMediaType = (
  urlPath: string,
): OpenApiPublication["mediaType"] =>
  getExtension(urlPath) === ".json" ? "application/json" : "application/yaml";

export const createOpenApiPublication = ({
  apiPath,
  urlPath,
  schema,
}: {
  apiPath: string;
  urlPath: string;
  schema: OpenAPIDocument;
}): OpenApiPublication => {
  const mediaType = getOpenApiMediaType(urlPath);
  const content =
    mediaType === "application/json"
      ? `${JSON.stringify(schema, null, 2)}\n`
      : stringifyYaml(schema);

  return { apiPath, urlPath, content, mediaType };
};

export const getRequestPathname = (requestUrl: string) => {
  try {
    return new URL(requestUrl, "http://zudoku.local").pathname;
  } catch {
    return undefined;
  }
};

export const findOpenApiPublication = (
  requestUrl: string,
  publications: OpenApiPublication[],
) => {
  const pathname = getRequestPathname(requestUrl);
  return publications.find((publication) => publication.urlPath === pathname);
};

type OpenApiDevRequest = {
  method?: string;
  url?: string;
};

type OpenApiDevResponse = {
  setHeader: (name: string, value: string) => unknown;
  end: (body?: string) => unknown;
};

/** Serves canonical publications and the existing schema-download routes. */
export const createOpenApiDevMiddleware =
  ({
    getPublications,
    getDownloadPathMap,
  }: {
    getPublications: () => OpenApiPublication[];
    getDownloadPathMap: () => ReadonlyMap<string, string>;
  }) =>
  async (
    req: OpenApiDevRequest,
    res: OpenApiDevResponse,
    next: () => unknown,
  ) => {
    if (!req.url || (req.method !== "GET" && req.method !== "HEAD")) {
      return next();
    }

    const publication = findOpenApiPublication(req.url, getPublications());
    if (publication) {
      res.setHeader("Content-Type", `${publication.mediaType}; charset=utf-8`);
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader(
        "Cache-Control",
        "public, max-age=0, s-maxage=3600, must-revalidate",
      );
      res.setHeader(
        "Link",
        `<${publication.urlPath}>; rel="service-desc"; type="${publication.mediaType}"`,
      );
      return res.end(req.method === "HEAD" ? undefined : publication.content);
    }

    const requestPathname = getRequestPathname(req.url);
    if (!requestPathname) return next();
    if (
      !requestPathname.toLowerCase().endsWith(".json") &&
      !requestPathname.toLowerCase().endsWith(".yaml") &&
      !requestPathname.toLowerCase().endsWith(".yml")
    ) {
      return next();
    }

    const inputPath = getDownloadPathMap().get(requestPathname);
    if (!inputPath) return next();

    const content = await fs.readFile(inputPath, "utf-8");
    const mediaType = getOpenApiMediaType(inputPath);
    res.setHeader("Content-Type", `${mediaType}; charset=utf-8`);
    return res.end(req.method === "HEAD" ? undefined : content);
  };

const resolveOutputPath = (outputDir: string, urlPath: string) => {
  const outputRoot = path.resolve(outputDir);
  const relativePath = urlPath.replace(/^\/+/, "");
  const outputPath = path.resolve(outputRoot, relativePath);

  if (
    !relativePath ||
    relativePath.includes("\\") ||
    relativePath.split("/").some((segment) => segment === "..") ||
    (!outputPath.startsWith(`${outputRoot}${path.sep}`) &&
      outputPath !== outputRoot)
  ) {
    throw new Error(`Unsafe OpenAPI publication output path: ${urlPath}`);
  }

  return outputPath;
};

export const writeOpenApiPublications = async (
  outputDir: string,
  publications: OpenApiPublication[],
) => {
  const outputs = publications.map((publication) => ({
    publication,
    outputPath: resolveOutputPath(outputDir, publication.urlPath),
  }));

  await Promise.all(
    outputs.map(async ({ publication, outputPath }) => {
      try {
        await fs.lstat(outputPath);
      } catch (error) {
        if (
          error instanceof Error &&
          "code" in error &&
          error.code === "ENOENT"
        ) {
          return;
        }
        throw error;
      }

      throw new Error(
        `Cannot publish OpenAPI for API "${publication.apiPath}" at "${publication.urlPath}" because a build artifact already exists at "${outputPath}". Choose another publish.path or remove the conflicting public/build artifact.`,
      );
    }),
  );

  await Promise.all(
    outputs.map(async ({ publication, outputPath }) => {
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, publication.content, "utf-8");
    }),
  );
};
