import { matchPath } from "react-router";
import type { BlogAuthor } from "../../../config/validators/ZudokuConfig.js";
import type { ZudokuPlugin } from "../../core/plugins.js";
import { joinUrl } from "../../util/joinUrl.js";
import type { MDXImport } from "../markdown/index.js";

export type { BlogAuthor };

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
  path: string;
  title: string;
  description?: string;
  postsPerPage: number;
  showReadingTime: boolean;
  sidebar: { title: string; count: number } | false;
  /** Full URL path of the RSS feed, including the site's base path */
  feedUrl?: string;
  tags: BlogTag[];
  /** Route path to post module, newest post first */
  postImports: Record<string, () => Promise<MDXImport>>;
  /** Metadata of all posts, newest first. Lazy so it stays out of the entry chunk */
  loadPosts: () => Promise<BlogPost[]>;
};

export const getBlogPagePath = (blogPath: string, page: number) =>
  page <= 1 ? blogPath : joinUrl(blogPath, "page", page);

export const getBlogTagPath = (blogPath: string, tag: Pick<BlogTag, "slug">) =>
  joinUrl(blogPath, "tags", tag.slug);

export const blogPlugin = (options: BlogPluginOptions): ZudokuPlugin => {
  const postPaths = Object.keys(options.postImports);
  const pageCount = Math.max(
    1,
    Math.ceil(postPaths.length / options.postsPerPage),
  );

  const listRoute = (path: string, page: number) => ({
    path,
    lazy: async () => {
      const [{ BlogListPage }, posts] = await Promise.all([
        import("./BlogListPage.js"),
        options.loadPosts(),
      ]);
      const start = (page - 1) * options.postsPerPage;
      return {
        element: (
          <BlogListPage
            options={options}
            posts={posts.slice(start, start + options.postsPerPage)}
            page={page}
            pageCount={pageCount}
          />
        ),
      };
    },
  });

  return {
    getRoutes: () => [
      ...Array.from({ length: pageCount }, (_, i) =>
        listRoute(getBlogPagePath(options.path, i + 1), i + 1),
      ),
      {
        path: joinUrl(options.path, "tags"),
        lazy: async () => {
          const [{ BlogTagsPage }, posts] = await Promise.all([
            import("./BlogTagsPage.js"),
            options.loadPosts(),
          ]);
          return { element: <BlogTagsPage options={options} posts={posts} /> };
        },
      },
      ...options.tags.map((tag) => ({
        path: getBlogTagPath(options.path, tag),
        lazy: async () => {
          const [{ BlogListPage }, posts] = await Promise.all([
            import("./BlogListPage.js"),
            options.loadPosts(),
          ]);
          return {
            element: (
              <BlogListPage
                options={options}
                posts={posts.filter((post) =>
                  post.tags.some((t) => t.slug === tag.slug),
                )}
                tag={tag}
              />
            ),
          };
        },
      })),
      ...Object.entries(options.postImports).map(([path, importPost]) => ({
        path,
        lazy: async () => {
          const [{ BlogPostPage }, posts, { default: Component, ...mdx }] =
            await Promise.all([
              import("./BlogPostPage.js"),
              options.loadPosts(),
              importPost(),
            ]);
          const index = posts.findIndex((post) => post.path === path);
          const post = posts[index];
          if (!post) throw new Error(`Blog post not found: ${path}`);

          return {
            element: (
              <BlogPostPage
                options={options}
                post={post}
                newer={posts[index - 1]}
                older={posts[index + 1]}
                mdxComponent={Component}
                {...mdx}
              />
            ),
          };
        },
      })),
    ],
    getNavigation: async (path) => {
      if (!options.sidebar) return [];
      if (!matchPath({ path: options.path, end: false }, path)) return [];

      const posts = await options.loadPosts();

      return [
        { type: "section", label: options.sidebar.title },
        ...posts.slice(0, options.sidebar.count).map((post) => ({
          type: "link" as const,
          to: post.path,
          label: post.title,
        })),
      ];
    },
  };
};
