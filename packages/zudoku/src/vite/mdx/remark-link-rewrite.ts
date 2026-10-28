import path from "node:path";
import type { Root } from "mdast";
import { visit } from "unist-util-visit";
import type { VFile } from "vfile";

const markdownExtension = /\.mdx?$/;

// Resolve a relative markdown link (e.g. `./foo/index.mdx`) to the route its
// target file is served at, honoring custom navigation paths. This keeps links
// pointing at the built page when a custom path collapses a route (e.g.
// `articles/monetization/index` served at `/articles/monetization`). Returns a
// basePath-free route; the router applies `basename` at render time.
const resolveToRoute = (
  url: string,
  filePath: string,
  routesByFile: Map<string, string>,
): string | undefined => {
  const [, pathname = "", suffix = ""] = url.match(/^([^#?]*)(.*)$/) ?? [];

  // Only relative file links are resolved against the route map; bare links and
  // absolute paths fall through to the default rewrite below.
  if (!markdownExtension.test(pathname) || pathname.startsWith("/")) {
    return undefined;
  }

  const targetFile = path
    .resolve(path.dirname(filePath), pathname)
    .replace(markdownExtension, "");

  const route = routesByFile.get(targetFile);
  if (route === undefined) return undefined;

  return `${route}${suffix}`;
};

export const remarkLinkRewrite =
  (basePath = "", routesByFile: Map<string, string> = new Map()) =>
  (tree: Root, vfile: VFile) => {
    visit(tree, "link", (node) => {
      if (!node.url) return;
      if (node.url.startsWith("http") || node.url.startsWith("mailto:")) return;

      node.url = node.url.replace(/\\/g, "/");

      const resolved = resolveToRoute(node.url, vfile.path, routesByFile);
      if (resolved !== undefined) {
        node.url = resolved;
        return;
      }

      const base = path.posix.join(basePath);
      if (basePath && node.url.startsWith(base)) {
        node.url = node.url.slice(base.length);
      } else if (!node.url.startsWith("/") && !node.url.startsWith("#")) {
        node.url = path.posix.join("..", node.url);
      }

      node.url = node.url.replace(/\.mdx?(#.*)?$/, "$1");
    });
  };
