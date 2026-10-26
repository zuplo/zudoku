/// <reference path="./virtual.d.ts" />
import { matchPath } from "react-router";
import { blogs } from "virtual:zudoku-blog";
import { tagPluginConfig } from "../../core/plugin-config.js";
import type { ZudokuPlugin } from "../../core/plugins.js";
import { joinUrl } from "../../util/joinUrl.js";
import {
  BLOG_PLUGIN_NAME,
  type BlogPageOptions,
  type BlogPluginOptions,
  getBlogPagePath,
  getBlogTagPath,
  resolveBlogOptions,
} from "./options.js";

export type {
  BlogAuthor,
  BlogPageOptions,
  BlogPluginOptions,
  BlogPost,
  BlogTag,
} from "./options.js";

/**
 * Publishes the Markdown and MDX files matched by `files` as a blog under
 * `path`. Posts are read at build time by Zudoku's blog Vite plugin, which
 * finds every `blogPlugin()` in `plugins`.
 */
export const blogPlugin = (options: BlogPluginOptions = {}): ZudokuPlugin => {
  const config = resolveBlogOptions(options);

  // Empty while the config file itself is loaded, where virtual modules are
  // stubbed
  const getManifest = () => blogs?.[config.path];

  const getPageOptions = (): BlogPageOptions => ({
    path: config.path,
    title: config.title,
    description: config.description,
    showReadingTime: config.showReadingTime,
    feedUrl: getManifest()?.feedUrl,
    tags: getManifest()?.tags ?? [],
  });

  const plugin: ZudokuPlugin = {
    getRoutes: () => {
      const manifest = getManifest();
      if (!manifest) return [];

      const { loadPosts, postImports } = manifest;
      const options = getPageOptions();
      const pageCount = Math.max(
        1,
        Math.ceil(Object.keys(postImports).length / config.postsPerPage),
      );

      const listRoute = (page: number) => ({
        path: getBlogPagePath(config.path, page),
        lazy: async () => {
          const [{ BlogListPage }, posts] = await Promise.all([
            import("./BlogListPage.js"),
            loadPosts(),
          ]);
          const start = (page - 1) * config.postsPerPage;
          return {
            element: (
              <BlogListPage
                options={options}
                posts={posts.slice(start, start + config.postsPerPage)}
                page={page}
                pageCount={pageCount}
              />
            ),
          };
        },
      });

      return [
        ...Array.from({ length: pageCount }, (_, i) => listRoute(i + 1)),
        {
          path: joinUrl(config.path, "tags"),
          lazy: async () => {
            const [{ BlogTagsPage }, posts] = await Promise.all([
              import("./BlogTagsPage.js"),
              loadPosts(),
            ]);
            return {
              element: <BlogTagsPage options={options} posts={posts} />,
            };
          },
        },
        ...manifest.tags.map((tag) => ({
          path: getBlogTagPath(config.path, tag),
          lazy: async () => {
            const [{ BlogListPage }, posts] = await Promise.all([
              import("./BlogListPage.js"),
              loadPosts(),
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
        ...Object.entries(postImports).map(([path, importPost]) => ({
          path,
          lazy: async () => {
            const [{ BlogPostPage }, posts, { default: Component, ...mdx }] =
              await Promise.all([
                import("./BlogPostPage.js"),
                loadPosts(),
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
      ];
    },
    getNavigation: async (path) => {
      const manifest = getManifest();
      if (!manifest || !config.sidebar) return [];
      if (!matchPath({ path: config.path, end: false }, path)) return [];

      const posts = await manifest.loadPosts();

      return [
        { type: "section", label: config.sidebar.title },
        ...posts.slice(0, config.sidebar.count).map((post) => ({
          type: "link" as const,
          to: post.path,
          label: post.title,
        })),
      ];
    },
  };

  return tagPluginConfig(plugin, BLOG_PLUGIN_NAME, options);
};
