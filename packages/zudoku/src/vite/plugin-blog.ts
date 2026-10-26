import { stat } from "node:fs/promises";
import path from "node:path";
import { glob } from "glob";
import globParent from "glob-parent";
import type { Nodes, Root } from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";
import { mdxFromMarkdown } from "mdast-util-mdx";
import { mdxjs } from "micromark-extension-mdxjs";
import colors from "picocolors";
import type { Plugin, ViteDevServer } from "vite";
import { logger } from "../cli/common/logger.js";
import { type ConfigWithMeta, getCurrentConfig } from "../config/loader.js";
import type {
  BlogAuthor,
  ZudokuBlogConfig,
} from "../config/validators/ZudokuConfig.js";
import type {
  BlogPluginOptions,
  BlogPost,
  BlogTag,
} from "../lib/plugins/blog/index.js";
import { joinUrl } from "../lib/util/joinUrl.js";
import { readFrontmatter } from "../lib/util/readFrontmatter.js";
import { slugify } from "../lib/util/slugify.js";
import { writePluginDebugCode } from "./debug.js";
import { reload } from "./plugin-config-reload.js";

export type BlogPostSource = BlogPost & {
  /** Path relative to the project root, with forward slashes */
  file: string;
};

const WORDS_PER_MINUTE = 200;
const DATE_PREFIX = /^(\d{4}-\d{2}-\d{2})(?:[-_]|$)/;

const warn = (message: string) =>
  logger.warn(colors.yellow(`[blog] ${message}`), { timestamp: true });

/**
 * Derives the slug and date from a post's path relative to the glob parent:
 * `2024-05-01-launch.md` and `2024-05-01-launch/index.mdx` both become slug
 * `launch` dated 2024-05-01. Nested folders are kept: `news/launch.md` becomes
 * `news/launch`.
 */
export const parsePostPath = (relativePath: string) => {
  const segments = relativePath.replace(/\.mdx?$/, "").split("/");
  if (segments.length > 1 && segments.at(-1) === "index") segments.pop();

  const name = segments.pop() ?? "";
  const date = name.match(DATE_PREFIX)?.[1];
  const slugName = date ? name.slice(date.length).replace(/^[-_]/, "") : name;

  return { slug: [...segments, slugName || name].join("/"), date };
};

const toArray = (value: unknown): unknown[] =>
  value === undefined || value === null
    ? []
    : Array.isArray(value)
      ? value
      : [value];

const nonEmptyString = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

const parseDate = (value: unknown) => {
  if (!(value instanceof Date) && typeof value !== "string") return;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

// Nodes whose children are inline text, so they're joined without spaces
const PHRASING_PARENTS = new Set([
  "paragraph",
  "heading",
  "emphasis",
  "strong",
  "delete",
  "link",
  "linkReference",
  "tableCell",
  "mdxJsxTextElement",
]);

// Text content of a node, leaving out raw HTML and MDX imports/expressions
const toText = (node: Nodes): string => {
  if ("children" in node) {
    const separator = PHRASING_PARENTS.has(node.type) ? "" : " ";
    return node.children.map(toText).join(separator);
  }
  if (node.type === "html" || node.type.startsWith("mdx")) return "";
  return "value" in node ? node.value : "";
};

const collapseWhitespace = (text: string) => text.replace(/\s+/g, " ").trim();

const parseMarkdown = (content: string, isMdx: boolean): Root | undefined => {
  // HTML comments are supported in MDX via `remark-comment`, but would be
  // invalid JSX here
  const withoutComments = content.replace(/<!--[\s\S]*?-->/g, "");

  try {
    return isMdx
      ? fromMarkdown(withoutComments, {
          extensions: [mdxjs()],
          mdastExtensions: [mdxFromMarkdown()],
          // biome-ignore lint/suspicious/noExplicitAny: mdast-util-from-markdown has type incompatibilities between versions
        } as any)
      : fromMarkdown(withoutComments);
  } catch {
    // Invalid MDX fails loudly when the post itself is compiled, so only
    // the derived metadata (title, excerpt, reading time) falls back here.
    return undefined;
  }
};

const isAbsoluteUrl = (url: string) => /^([a-z][a-z\d+.-]*:|\/\/)/i.test(url);

// Paths like `/avatars/jane.png` point to the public folder, which is served
// under the base path
const withBasePath = (config: ConfigWithMeta, url: string | undefined) =>
  url && !isAbsoluteUrl(url) ? joinUrl(config.basePath, url) : url;

const resolveAuthor = (
  config: ConfigWithMeta,
  entry: unknown,
  file: string,
): BlogAuthor | undefined => {
  if (typeof entry === "string") {
    const author = config.blog?.authors[entry];
    if (author) {
      return { ...author, imageUrl: withBasePath(config, author.imageUrl) };
    }
    warn(`Unknown author "${entry}" in ${file}. Add it to \`blog.authors\`.`);
    return { name: entry };
  }
  if (typeof entry !== "object" || entry === null) return;

  const record = entry as Record<string, unknown>;
  const name = nonEmptyString(record.name);
  if (!name) return;

  return {
    name,
    title: nonEmptyString(record.title),
    url: nonEmptyString(record.url),
    imageUrl: withBasePath(config, nonEmptyString(record.imageUrl)),
  };
};

const resolveTags = (value: unknown): BlogTag[] => {
  const tags = new Map<string, BlogTag>();
  for (const entry of toArray(value)) {
    const label = nonEmptyString(
      typeof entry === "number" ? `${entry}` : entry,
    );
    if (!label) continue;
    const slug = slugify(label);
    if (slug && !tags.has(slug)) tags.set(slug, { label, slug });
  }
  return [...tags.values()];
};

const readPost = async (
  config: ConfigWithMeta,
  blog: ZudokuBlogConfig,
  file: string,
  globRoot: string,
): Promise<BlogPostSource | undefined> => {
  const absolutePath = path.resolve(config.__meta.rootDir, file);
  const { data, content } = await readFrontmatter(absolutePath);

  const draft = data.draft === true;
  if (draft && process.env.NODE_ENV !== "development") return;

  const fromPath = parsePostPath(path.posix.relative(globRoot, file));
  const slug = nonEmptyString(data.slug)?.replace(/^\/+|\/+$/g, "");
  const tree = parseMarkdown(content, file.endsWith(".mdx"));

  const contentTitle = tree?.children.find(
    (node) => node.type === "heading" && node.depth === 1,
  );
  const firstParagraph = tree?.children
    .filter((node) => node.type === "paragraph")
    .map((node) => collapseWhitespace(toText(node)))
    .find(Boolean);

  const words = collapseWhitespace(tree ? toText(tree) : content)
    .split(" ")
    .filter(Boolean).length;

  let date = parseDate(data.date);
  if (data.date !== undefined && !date) {
    warn(`Invalid date "${data.date}" in ${file}.`);
  }
  date ??= parseDate(fromPath.date) ?? (await stat(absolutePath)).mtime;

  return {
    file,
    path: joinUrl(blog.path, slug ?? fromPath.slug),
    title:
      nonEmptyString(data.title) ??
      (contentTitle ? collapseWhitespace(toText(contentTitle)) : undefined) ??
      fromPath.slug,
    description: nonEmptyString(data.description) ?? firstParagraph,
    date: date.toISOString(),
    authors: toArray(data.authors).flatMap(
      (entry) => resolveAuthor(config, entry, file) ?? [],
    ),
    tags: resolveTags(data.tags),
    readingTime: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
    image: resolveImage(config, nonEmptyString(data.image)),
    ...(draft ? { draft } : {}),
  };
};

/**
 * Globs the blog posts and reads their metadata, newest post first. Drafts are
 * only included in development.
 */
export const loadBlogPosts = async (
  config: ConfigWithMeta,
): Promise<BlogPostSource[]> => {
  const { blog } = config;
  if (!blog) return [];

  const posts = await Promise.all(
    blog.files.map(async (pattern) => {
      const files = await glob(pattern, {
        root: config.__meta.rootDir,
        cwd: config.__meta.rootDir,
        ignore: ["**/node_modules/**", "**/dist/**", "**/.git/**"],
        absolute: false,
        posix: true,
      });
      const globRoot = globParent(pattern).replace(/^\.?\//, "");

      return Promise.all(
        files.map((file) => readPost(config, blog, file, globRoot)),
      );
    }),
  );

  const sorted = posts
    .flat()
    .filter((post) => post !== undefined)
    .sort(
      (a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title),
    );

  // Two files can resolve to the same route, e.g. through a `slug`. The
  // newest one wins.
  const byPath = new Map<string, BlogPostSource>();
  for (const post of sorted) {
    const existing = byPath.get(post.path);
    if (!existing) {
      byPath.set(post.path, post);
    } else if (existing.file !== post.file) {
      warn(
        `${post.file} and ${existing.file} both resolve to ${post.path}. Only ${existing.file} is used.`,
      );
    }
  }

  return [...byPath.values()];
};

export const getBlogSiteUrl = (config: ConfigWithMeta) =>
  config.canonicalUrlOrigin ?? config.sitemap?.siteUrl;

// `og:image` needs an absolute URL to be picked up when a post is shared
const resolveImage = (config: ConfigWithMeta, image: string | undefined) => {
  const siteUrl = getBlogSiteUrl(config);
  if (!image || isAbsoluteUrl(image) || !siteUrl) {
    return withBasePath(config, image);
  }
  return joinUrl(siteUrl, config.basePath, image);
};

const isFeedEnabled = (config: ConfigWithMeta) =>
  Boolean(config.blog && (config.blog.feed ?? true) && getBlogSiteUrl(config));

const getFeedPath = (blog: ZudokuBlogConfig) => joinUrl(blog.path, "rss.xml");

const escapeXml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

export const generateRssFeed = ({
  siteUrl,
  basePath,
  blog,
  posts,
}: {
  siteUrl: string;
  basePath?: string;
  blog: ZudokuBlogConfig;
  posts: BlogPost[];
}) => {
  const url = (routePath: string) => joinUrl(siteUrl, basePath, routePath);
  const tag = (name: string, value: string | undefined) =>
    value ? `<${name}>${escapeXml(value)}</${name}>` : "";

  const items = posts.map((post) =>
    [
      "    <item>",
      `      ${tag("title", post.title)}`,
      `      ${tag("link", url(post.path))}`,
      `      <guid isPermaLink="true">${escapeXml(url(post.path))}</guid>`,
      `      ${tag("pubDate", new Date(post.date).toUTCString())}`,
      post.description && `      ${tag("description", post.description)}`,
      ...post.authors.map((a) => `      ${tag("dc:creator", a.name)}`),
      ...post.tags.map((t) => `      ${tag("category", t.label)}`),
      "    </item>",
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">',
    "  <channel>",
    `    ${tag("title", blog.title)}`,
    `    ${tag("link", url(blog.path))}`,
    `    ${tag("description", blog.description ?? blog.title)}`,
    `    <atom:link href="${escapeXml(url(getFeedPath(blog)))}" rel="self" type="application/rss+xml"/>`,
    ...items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
};

const pluginModuleId = "virtual:zudoku-blog-plugin";
const postsModuleId = "virtual:zudoku-blog-posts";

const getPluginOptions = (
  config: ConfigWithMeta,
  blog: ZudokuBlogConfig,
  posts: BlogPostSource[],
) => {
  // Posts are sorted newest first, so the newest spelling of a tag wins
  const tags = new Map<string, BlogTag>();
  for (const tag of posts.flatMap((post) => post.tags)) {
    if (!tags.has(tag.slug)) tags.set(tag.slug, tag);
  }

  return {
    path: blog.path,
    title: blog.title,
    description: blog.description,
    postsPerPage: blog.postsPerPage,
    showReadingTime: blog.showReadingTime,
    sidebar: blog.sidebar,
    feedUrl: isFeedEnabled(config)
      ? joinUrl(config.basePath, getFeedPath(blog))
      : undefined,
    tags: [...tags.values()].sort((a, b) => a.label.localeCompare(b.label)),
  } satisfies Omit<BlogPluginOptions, "postImports" | "loadPosts">;
};

const viteBlogPlugin = (): Plugin => {
  const resolvedPluginModuleId = `\0${pluginModuleId}`;
  const resolvedPostsModuleId = `\0${postsModuleId}`;

  return {
    name: "zudoku-blog-plugin",
    resolveId(id) {
      if (id === pluginModuleId) return resolvedPluginModuleId;
      if (id === postsModuleId) return resolvedPostsModuleId;
    },
    async load(id) {
      if (id !== resolvedPluginModuleId && id !== resolvedPostsModuleId) {
        return;
      }

      const config = getCurrentConfig();
      const { blog } = config;

      if (
        id === resolvedPluginModuleId &&
        (!blog || config.__meta.mode === "standalone")
      ) {
        return `export const configuredBlogPlugin = undefined;`;
      }
      if (!blog) return `export const posts = [];`;

      const posts = await loadBlogPosts(config);

      if (id === resolvedPostsModuleId) {
        return `export const posts = ${JSON.stringify(
          posts.map(({ file: _file, ...post }) => post),
        )};`;
      }

      const code = [
        `import { blogPlugin } from "zudoku/plugins/blog";`,
        `export const configuredBlogPlugin = blogPlugin({`,
        `  ...${JSON.stringify(getPluginOptions(config, blog, posts))},`,
        `  postImports: {`,
        ...posts.map(
          (post) =>
            `    ${JSON.stringify(post.path)}: () => import(${JSON.stringify(joinUrl(post.file))}),`,
        ),
        `  },`,
        `  loadPosts: () => import("${postsModuleId}").then((m) => m.posts),`,
        `});`,
      ];

      await writePluginDebugCode(config.__meta.rootDir, "blog-plugin", code);

      return code.join("\n");
    },
    async generateBundle() {
      if (this.environment.name !== "client") return;

      const config = getCurrentConfig();
      const { blog } = config;
      const siteUrl = getBlogSiteUrl(config);
      if (!blog || config.__meta.mode === "standalone") return;

      if (!isFeedEnabled(config) || !siteUrl) {
        if (blog.feed) {
          warn(
            "Skipping the RSS feed: set `canonicalUrlOrigin` or `sitemap.siteUrl` so the feed can link to posts.",
          );
        }
        return;
      }

      this.emitFile({
        type: "asset",
        fileName: getFeedPath(blog).slice(1),
        source: generateRssFeed({
          siteUrl,
          basePath: config.basePath,
          blog,
          posts: await loadBlogPosts(config),
        }),
      });
    },
    async configureServer(server) {
      const isEnabled = (config: ConfigWithMeta) =>
        config.blog !== undefined && config.__meta.mode !== "standalone";

      let posts = isEnabled(getCurrentConfig())
        ? await loadBlogPosts(getCurrentConfig())
        : [];

      server.middlewares.use(async (req, res, next) => {
        const config = getCurrentConfig();
        const { blog } = config;
        const siteUrl = getBlogSiteUrl(config);
        const pathname = req.url?.split(/[?#]/)[0];
        if (
          !blog ||
          !siteUrl ||
          !isEnabled(config) ||
          !isFeedEnabled(config) ||
          pathname !== joinUrl(config.basePath, getFeedPath(blog))
        ) {
          return next();
        }

        res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
        res.end(
          generateRssFeed({
            siteUrl,
            basePath: config.basePath,
            blog,
            posts: await loadBlogPosts(config),
          }),
        );
      });

      // Posts are added, removed or edited: refresh the generated modules. A
      // changed set of routes needs a full reload.
      server.watcher.on("all", async (event, filePath) => {
        if (!["add", "change", "unlink"].includes(event)) return;
        if (!/\.mdx?$/.test(filePath)) return;

        const config = getCurrentConfig();
        if (!isEnabled(config)) return;

        const previous = posts;
        posts = await loadBlogPosts(config);
        if (JSON.stringify(previous) === JSON.stringify(posts)) return;

        const routes = (list: BlogPostSource[]) =>
          JSON.stringify(list.map((p) => [p.path, p.tags.map((t) => t.slug)]));
        if (routes(previous) !== routes(posts)) return reload(server);

        invalidateBlogModules(server);
      });
    },
  };
};

const invalidateBlogModules = (server: ViteDevServer) => {
  for (const environment of Object.values(server.environments)) {
    for (const id of [pluginModuleId, postsModuleId]) {
      const module = environment.moduleGraph.getModuleById(`\0${id}`);
      if (module) environment.moduleGraph.invalidateModule(module);
    }
  }
};

export default viteBlogPlugin;
