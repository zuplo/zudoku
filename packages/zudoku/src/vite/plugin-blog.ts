import { spawnSync } from "node:child_process";
import { stat } from "node:fs/promises";
import path from "node:path";
import { glob } from "glob";
import globParent from "glob-parent";
import type { Nodes, Root } from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";
import { mdxFromMarkdown } from "mdast-util-mdx";
import { mdxjs } from "micromark-extension-mdxjs";
import colors from "picocolors";
import type { Plugin } from "vite";
import { logger } from "../cli/common/logger.js";
import { type ConfigWithMeta, getCurrentConfig } from "../config/loader.js";
import { selectPluginConfigs } from "../lib/core/plugin-config.js";
import {
  BLOG_PLUGIN_NAME,
  type BlogAuthor,
  type BlogPluginOptions,
  type BlogPost,
  type BlogTag,
  type ResolvedBlogOptions,
  resolveBlogOptions,
} from "../lib/plugins/blog/options.js";
import { ZudokuError } from "../lib/util/invariant.js";
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
  // invalid JSX here. Repeated so that removing one can't form another.
  let withoutComments = content;
  for (let previous = ""; previous !== withoutComments; ) {
    previous = withoutComments;
    withoutComments = withoutComments.replace(/<!--[\s\S]*?-->/g, "");
  }

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
  blog: ResolvedBlogOptions,
  entry: unknown,
  file: string,
): BlogAuthor | undefined => {
  if (typeof entry === "string") {
    const author = blog.authors[entry];
    if (author) {
      return { ...author, imageUrl: withBasePath(config, author.imageUrl) };
    }
    warn(
      `Unknown author "${entry}" in ${file}. Add it to the \`authors\` of \`blogPlugin()\`.`,
    );
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

// The date of the commit that added the file. Unlike its mtime, this stays the
// same across checkouts. Shallow clones only know their own commits.
const getGitCreatedDate = (absolutePath: string) => {
  const result = spawnSync(
    "git",
    ["log", "--diff-filter=A", "--follow", "--format=%cI", "--", absolutePath],
    {
      cwd: path.dirname(absolutePath),
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    },
  );
  if (result.status !== 0) return;
  return parseDate(result.stdout.trim().split("\n").at(-1));
};

const readPost = async (
  config: ConfigWithMeta,
  blog: ResolvedBlogOptions,
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
  date ??=
    parseDate(fromPath.date) ??
    getGitCreatedDate(absolutePath) ??
    (await stat(absolutePath)).mtime;

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
      (entry) => resolveAuthor(config, blog, entry, file) ?? [],
    ),
    tags: resolveTags(data.tags),
    readingTime: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
    image: resolveImage(config, nonEmptyString(data.image)),
    ...(draft ? { draft } : {}),
  };
};

const isIndexFile = (file: string) => /(^|\/)index\.mdx?$/.test(file);

/**
 * Files matched by a blog's glob that are posts, given relative to the glob
 * parent. A folder with an `index.md(x)` is one post, so other Markdown files
 * in it (partials, READMEs) are not posts. Neither are files or folders that
 * start with `_`.
 */
export const filterPostFiles = (files: string[]) => {
  const postFolders = new Set(
    files
      .filter((file) => isIndexFile(file) && file.includes("/"))
      .map((file) => path.posix.dirname(file)),
  );

  return files.filter((file) => {
    const segments = file.split("/");
    if (segments.some((segment) => segment.startsWith("_"))) return false;
    if (isIndexFile(file)) return true;

    return !segments
      .slice(0, -1)
      .some((_, i) => postFolders.has(segments.slice(0, i + 1).join("/")));
  });
};

// Paths the blog's own pages are served at
const isReservedPath = (blog: ResolvedBlogOptions, postPath: string) => {
  const subPath = postPath.slice(blog.path.length).replace(/^\//, "");
  return (
    subPath === "" ||
    subPath === "tags" ||
    subPath === "rss.xml" ||
    subPath.startsWith("tags/") ||
    subPath.startsWith("page/")
  );
};

/**
 * Globs the blog posts and reads their metadata, newest post first. Drafts are
 * only included in development.
 */
export const loadBlogPosts = async (
  config: ConfigWithMeta,
  blog: ResolvedBlogOptions,
): Promise<BlogPostSource[]> => {
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
      const postFiles = filterPostFiles(
        files.map((file) => path.posix.relative(globRoot, file)),
      );

      return Promise.all(
        postFiles.map((file) =>
          readPost(config, blog, path.posix.join(globRoot, file), globRoot),
        ),
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
    if (isReservedPath(blog, post.path)) {
      warn(
        `${post.file} resolves to ${post.path}, which is used by the blog's own pages. Rename it or set a different \`slug\`.`,
      );
      continue;
    }

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

const isFeedEnabled = (config: ConfigWithMeta, blog: ResolvedBlogOptions) =>
  Boolean((blog.feed ?? true) && getBlogSiteUrl(config));

const getFeedPath = (blog: ResolvedBlogOptions) =>
  joinUrl(blog.path, "rss.xml");

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
  blog: ResolvedBlogOptions;
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

/**
 * Options of every `blogPlugin()` in the config's `plugins`. Each blog needs
 * its own path, since the generated data is keyed by it.
 */
export const getBlogs = (config: ConfigWithMeta): ResolvedBlogOptions[] => {
  if (config.__meta.mode === "standalone") return [];

  const blogs = selectPluginConfigs<BlogPluginOptions | undefined>(
    config.plugins ?? [],
    BLOG_PLUGIN_NAME,
  ).map((options) => resolveBlogOptions(options));

  const duplicate = blogs.find(
    (blog, index) => blogs.findIndex((b) => b.path === blog.path) !== index,
  );
  if (duplicate) {
    throw new ZudokuError(
      `Multiple blogs are configured with the path "${duplicate.path}".`,
      {
        title: "Conflicting blog paths",
        developerHint:
          "Give each `blogPlugin()` in `plugins` its own `path`, e.g. `/blog` and `/changelog`.",
      },
    );
  }

  return blogs;
};

// The virtual modules of both environments, the feed and link rewriting all
// read the same posts, so a build parses them once. The dev server clears it
// when a post changes.
const postsCache = new Map<string, Promise<BlogPostSource[]>>();

const getBlogPosts = (config: ConfigWithMeta, blog: ResolvedBlogOptions) => {
  const key = JSON.stringify([
    config.__meta.rootDir,
    config.basePath,
    getBlogSiteUrl(config),
    blog,
  ]);
  const cached = postsCache.get(key);
  if (cached) return cached;

  const posts = loadBlogPosts(config, blog);
  postsCache.set(key, posts);
  // Don't keep a failed load around, e.g. a post that was deleted mid-read
  posts.catch(() => postsCache.delete(key));
  return posts;
};

/**
 * Post files (absolute, without extension) mapped to the routes they're served
 * at, so relative links between posts resolve to their slugs
 */
export const getBlogRoutesByFile = async (config: ConfigWithMeta) => {
  const posts = await Promise.all(
    getBlogs(config).map((blog) => getBlogPosts(config, blog)),
  );

  return new Map(
    posts
      .flat()
      .map((post) => [
        path.resolve(config.__meta.rootDir, post.file).replace(/\.mdx?$/, ""),
        post.path,
      ]),
  );
};

const isInBlogFolder = (config: ConfigWithMeta, filePath: string) =>
  getBlogs(config)
    .flatMap((blog) => blog.files)
    .map((pattern) => globParent(pattern).replace(/^\.?\//, ""))
    .some((folder) => {
      const relative = path.relative(
        path.resolve(config.__meta.rootDir, folder),
        filePath,
      );
      return (
        relative !== ".." &&
        !relative.startsWith(`..${path.sep}`) &&
        !path.isAbsolute(relative)
      );
    });

const manifestModuleId = "virtual:zudoku-blog";
// Followed by the blog's path, e.g. `virtual:zudoku-blog/posts/blog`
const postsModulePrefix = "virtual:zudoku-blog/posts";

const generateManifest = async (config: ConfigWithMeta) => {
  const entries = await Promise.all(
    getBlogs(config).map(async (blog) => {
      const posts = await getBlogPosts(config, blog);

      // Posts are sorted newest first, so the newest spelling of a tag wins
      const tags = new Map<string, BlogTag>();
      for (const tag of posts.flatMap((post) => post.tags)) {
        if (!tags.has(tag.slug)) tags.set(tag.slug, tag);
      }

      const data = {
        tags: [...tags.values()].sort((a, b) => a.label.localeCompare(b.label)),
        feedUrl: isFeedEnabled(config, blog)
          ? joinUrl(config.basePath, getFeedPath(blog))
          : undefined,
      };

      return [
        `  ${JSON.stringify(blog.path)}: {`,
        `    ...${JSON.stringify(data)},`,
        `    postImports: {`,
        ...posts.map(
          (post) =>
            `      ${JSON.stringify(post.path)}: () => import(${JSON.stringify(joinUrl(post.file))}),`,
        ),
        `    },`,
        `    loadPosts: () => import(${JSON.stringify(postsModulePrefix + blog.path)}).then((m) => m.posts),`,
        `  },`,
      ];
    }),
  );

  return [`export const blogs = {`, ...entries.flat(), `};`];
};

const viteBlogPlugin = (): Plugin => {
  const resolvedManifestId = `\0${manifestModuleId}`;
  const resolvedPostsPrefix = `\0${postsModulePrefix}`;

  return {
    name: "zudoku-blog-plugin",
    resolveId(id) {
      if (id === manifestModuleId || id.startsWith(`${postsModulePrefix}/`)) {
        return `\0${id}`;
      }
    },
    async load(id) {
      if (id === resolvedManifestId) {
        const config = getCurrentConfig();
        const code = await generateManifest(config);
        await writePluginDebugCode(config.__meta.rootDir, "blog-plugin", code);
        return code.join("\n");
      }

      if (id.startsWith(`${resolvedPostsPrefix}/`)) {
        const config = getCurrentConfig();
        const blogPath = id.slice(resolvedPostsPrefix.length);
        const blog = getBlogs(config).find((b) => b.path === blogPath);
        const posts = blog ? await getBlogPosts(config, blog) : [];

        return `export const posts = ${JSON.stringify(
          posts.map(({ file: _file, ...post }) => post),
        )};`;
      }
    },
    async generateBundle() {
      if (this.environment.name !== "client") return;

      const config = getCurrentConfig();
      const siteUrl = getBlogSiteUrl(config);

      for (const blog of getBlogs(config)) {
        if (!siteUrl || !isFeedEnabled(config, blog)) {
          if (blog.feed) {
            warn(
              `Skipping the RSS feed of ${blog.path}: set \`canonicalUrlOrigin\` or \`sitemap.siteUrl\` so the feed can link to posts.`,
            );
          }
          continue;
        }

        this.emitFile({
          type: "asset",
          fileName: getFeedPath(blog).slice(1),
          source: generateRssFeed({
            siteUrl,
            basePath: config.basePath,
            blog,
            posts: await getBlogPosts(config, blog),
          }),
        });
      }
    },
    async configureServer(server) {
      const loadAll = (config: ConfigWithMeta) =>
        Promise.all(
          getBlogs(config).map((blog) => getBlogPosts(config, blog)),
        ).then((posts) => JSON.stringify(posts));

      let snapshot = await loadAll(getCurrentConfig());

      server.middlewares.use(async (req, res, next) => {
        const config = getCurrentConfig();
        const siteUrl = getBlogSiteUrl(config);
        const pathname = req.url?.split(/[?#]/)[0];
        const blog = getBlogs(config).find(
          (b) => joinUrl(config.basePath, getFeedPath(b)) === pathname,
        );
        if (!blog || !siteUrl || !isFeedEnabled(config, blog)) return next();

        res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
        res.end(
          generateRssFeed({
            siteUrl,
            basePath: config.basePath,
            blog,
            posts: await getBlogPosts(config, blog),
          }),
        );
      });

      // A post was added, removed or edited. Routes, list pages and the
      // sidebar are built from its metadata, so a change to it needs a full
      // reload; content-only edits are left to MDX hot reloading.
      server.watcher.on("all", async (event, filePath) => {
        if (!["add", "change", "unlink"].includes(event)) return;
        if (!/\.mdx?$/.test(filePath)) return;

        const config = getCurrentConfig();
        if (!isInBlogFolder(config, filePath)) return;

        postsCache.clear();
        const previous = snapshot;
        snapshot = await loadAll(config);
        if (previous !== snapshot) reload(server);
      });
    },
  };
};

export default viteBlogPlugin;
