import { joinUrl } from "../../util/joinUrl.js";
import type { MDXImport } from "../markdown/index.js";

// Shared by the runtime plugin and its build-time Vite plugin, so this module
// must not import React or virtual modules.

export const BLOG_PLUGIN_NAME = "zudoku-blog";

export type BlogAuthor = {
  name: string;
  title?: string;
  url?: string;
  imageUrl?: string;
};

export type BlogTag = {
  label: string;
  slug: string;
};

export type BlogPost = {
  path: string;
  title: string;
  description?: string;
  /** ISO 8601 */
  date: string;
  authors: BlogAuthor[];
  tags: BlogTag[];
  /** In minutes */
  readingTime: number;
  image?: string;
  draft?: boolean;
};

export type BlogPluginOptions = {
  /**
   * Glob pattern(s) for the Markdown and MDX files of blog posts.
   * @default "/blog/**\/*.{md,mdx}"
   */
  files?: string | string[];
  /**
   * The route the blog is served under.
   * @default "/blog"
   */
  path?: string;
  /**
   * Heading of the blog index page and the title of the feed.
   * @default "Blog"
   */
  title?: string;
  /** Shown below the title on the blog index page and in the feed. */
  description?: string;
  /** @default 10 */
  postsPerPage?: number;
  /** @default true */
  showReadingTime?: boolean;
  /** Authors that posts can reference by key in their `authors` frontmatter. */
  authors?: Record<string, BlogAuthor>;
  /**
   * Sidebar listing the most recent posts, or `false` to hide it.
   * @default { title: "Recent posts", count: 5 }
   */
  sidebar?: { title?: string; count?: number } | false;
  /**
   * Generates an RSS feed at `<path>/rss.xml`. Needs `canonicalUrlOrigin` or
   * `sitemap.siteUrl` to build absolute links, and defaults to on when one of
   * them is set.
   */
  feed?: boolean;
};

export type ResolvedBlogOptions = {
  files: string[];
  path: string;
  title: string;
  description?: string;
  postsPerPage: number;
  showReadingTime: boolean;
  authors: Record<string, BlogAuthor>;
  sidebar: { title: string; count: number } | false;
  feed?: boolean;
};

export const resolveBlogOptions = (
  options: BlogPluginOptions = {},
): ResolvedBlogOptions => ({
  files:
    typeof options.files === "string"
      ? [options.files]
      : (options.files ?? ["/blog/**/*.{md,mdx}"]),
  path: joinUrl(options.path ?? "/blog"),
  title: options.title ?? "Blog",
  description: options.description,
  postsPerPage: Math.max(1, Math.floor(options.postsPerPage ?? 10)),
  showReadingTime: options.showReadingTime ?? true,
  authors: options.authors ?? {},
  sidebar:
    options.sidebar === false
      ? false
      : {
          title: options.sidebar?.title ?? "Recent posts",
          count: options.sidebar?.count ?? 5,
        },
  feed: options.feed,
});

/** Build-time data of one blog, generated into `virtual:zudoku-blog` */
export type BlogManifest = {
  tags: BlogTag[];
  /** Full URL path of the RSS feed, including the site's base path */
  feedUrl?: string;
  /** Route path to post module, newest post first */
  postImports: Record<string, () => Promise<MDXImport>>;
  /** Metadata of all posts, newest first. Lazy so it stays out of the entry chunk */
  loadPosts: () => Promise<BlogPost[]>;
};

/** What the blog pages need to render */
export type BlogPageOptions = Pick<
  ResolvedBlogOptions,
  "path" | "title" | "description" | "showReadingTime"
> &
  Pick<BlogManifest, "feedUrl" | "tags">;

export const getBlogPagePath = (blogPath: string, page: number) =>
  page <= 1 ? blogPath : joinUrl(blogPath, "page", page);

export const getBlogTagPath = (blogPath: string, tag: Pick<BlogTag, "slug">) =>
  joinUrl(blogPath, "tags", tag.slug);
