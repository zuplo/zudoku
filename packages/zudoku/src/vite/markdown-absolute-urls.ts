import path from "node:path";
import { joinUrl } from "../lib/util/joinUrl.js";

export type MarkdownSiteConfig = {
  canonicalUrlOrigin?: string;
  sitemap?: { siteUrl?: string } | null;
};

/**
 * Public site origin for absolute URLs in exported markdown and llms.txt.
 * Prefer `canonicalUrlOrigin`; fall back to `sitemap.siteUrl` (same as sitemap generation).
 */
export const resolveMarkdownSiteOrigin = (
  config: MarkdownSiteConfig,
): string | undefined => {
  const canonical = config.canonicalUrlOrigin?.trim();
  if (canonical) {
    return canonical.replace(/\/$/, "");
  }
  const siteUrl = config.sitemap?.siteUrl?.trim();
  if (siteUrl) {
    return siteUrl.replace(/\/$/, "");
  }
  return undefined;
};

const originWithSlash = (origin: string) => `${origin.replace(/\/$/, "")}/`;

/**
 * Build an absolute URL for a path under the deployed site (includes `basePath`).
 */
export const toAbsoluteSiteUrl = (
  origin: string,
  basePath: string | undefined,
  pathname: string,
): string => {
  const sitePath = joinUrl(basePath ?? "", pathname);
  return new URL(sitePath, originWithSlash(origin)).href;
};

const splitHash = (url: string): { pathAndQuery: string; hash: string } => {
  const hashIndex = url.indexOf("#");
  if (hashIndex === -1) {
    return { pathAndQuery: url, hash: "" };
  }
  return {
    pathAndQuery: url.slice(0, hashIndex),
    hash: url.slice(hashIndex),
  };
};

/**
 * Resolve a markdown link/image destination to an absolute http(s) URL when possible.
 */
export const absolutizeMarkdownUrl = (
  rawUrl: string,
  routePath: string,
  basePath: string | undefined,
  origin: string,
): string => {
  const trimmed = rawUrl.trim();
  if (!trimmed || /^mailto:/i.test(trimmed)) {
    return rawUrl;
  }

  const { pathAndQuery, hash } = splitHash(trimmed);

  if (/^https?:\/\//i.test(pathAndQuery)) {
    return rawUrl;
  }

  if (!pathAndQuery) {
    const pageSitePath = joinUrl(
      basePath ?? "",
      routePath === "/" || routePath === "" ? "/" : routePath,
    );
    return new URL(`${pageSitePath}${hash}`, originWithSlash(origin)).href;
  }

  const pathname = pathAndQuery.startsWith("/")
    ? pathAndQuery
    : path.posix.resolve(
        path.posix.dirname(
          routePath === "/" || routePath === "" ? "/index" : routePath,
        ),
        pathAndQuery,
      );

  const sitePath = joinUrl(basePath ?? "", pathname);
  return new URL(`${sitePath}${hash}`, originWithSlash(origin)).href;
};

const rewriteChunk = (
  chunk: string,
  routePath: string,
  basePath: string | undefined,
  origin: string,
): string => {
  const replaceDest = (
    full: string,
    prefix: string,
    text: string,
    dest: string,
  ) => {
    const next = absolutizeMarkdownUrl(
      dest.trim(),
      routePath,
      basePath,
      origin,
    );
    if (next === dest.trim()) {
      return full;
    }
    return `${prefix}[${text}](${next})`;
  };

  let out = chunk.replace(
    /!\[([^\]]*)\]\(\s*([^)]+?)\s*\)/g,
    (full, text: string, dest: string) => replaceDest(full, "!", text, dest),
  );
  out = out.replace(
    /(?<!!)\[([^\]]*)\]\(\s*([^)]+?)\s*\)/g,
    (full, text: string, dest: string) => replaceDest(full, "", text, dest),
  );
  return out;
};

/**
 * Rewrite relative `[text](url)` and `![alt](url)` targets to absolute URLs.
 * Code fenced blocks are left unchanged.
 */
export const rewriteMarkdownLinksToAbsolute = (
  markdown: string,
  context: { origin: string; basePath?: string; routePath: string },
): string =>
  markdown
    .split(/(```[\s\S]*?```)/g)
    .map((part, i) =>
      i % 2 === 1
        ? part
        : rewriteChunk(
            part,
            context.routePath,
            context.basePath,
            context.origin,
          ),
    )
    .join("");
