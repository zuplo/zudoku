import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { Link, Root } from "mdast";
import { VFile } from "vfile";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ConfigWithMeta } from "../config/loader.js";
import { validateConfig } from "../config/validators/ZudokuConfig.js";
import { isNavigationPlugin } from "../lib/core/plugins.js";
import { blogPlugin } from "../lib/plugins/blog/index.js";
import {
  type BlogManifest,
  type BlogPost,
  resolveBlogOptions,
} from "../lib/plugins/blog/options.js";
import { remarkLinkRewrite } from "./mdx/remark-link-rewrite.js";
import {
  type BlogPostSource,
  filterPostFiles,
  generateRssFeed,
  getBlogRoutesByFile,
  getBlogs,
  loadBlogPosts,
  parsePostPath,
} from "./plugin-blog.js";
import { routesToPaths } from "./prerender/utils.js";

const { manifests } = vi.hoisted(() => ({
  manifests: {} as Record<string, BlogManifest>,
}));

vi.mock("virtual:zudoku-blog", () => ({ blogs: manifests }));

const withMeta = (
  config: Record<string, unknown>,
  rootDir = "/project",
): ConfigWithMeta => ({
  ...validateConfig(config),
  __meta: {
    rootDir,
    moduleDir: path.join(rootDir, "node_modules"),
    mode: "module",
    dependencies: [],
    configPath: path.join(rootDir, "zudoku.config.ts"),
  },
});

describe("resolveBlogOptions", () => {
  it("applies defaults", () => {
    expect(resolveBlogOptions()).toEqual({
      files: ["/blog/**/*.{md,mdx}"],
      path: "/blog",
      title: "Blog",
      postsPerPage: 10,
      showReadingTime: true,
      authors: {},
      sidebar: { title: "Recent posts", count: 5 },
    });
  });

  it("normalizes the path and files and keeps a disabled sidebar", () => {
    expect(
      resolveBlogOptions({
        path: "news/",
        files: "/posts/*.md",
        sidebar: false,
        postsPerPage: 0,
      }),
    ).toMatchObject({
      path: "/news",
      files: ["/posts/*.md"],
      sidebar: false,
      postsPerPage: 1,
    });
  });
});

describe("getBlogs", () => {
  it("collects every blogPlugin from the config's plugins", () => {
    const config = withMeta({
      plugins: [
        blogPlugin(),
        { getHead: () => null },
        blogPlugin({ path: "/changelog", title: "Changelog" }),
      ],
    });

    expect(getBlogs(config).map((blog) => [blog.path, blog.title])).toEqual([
      ["/blog", "Blog"],
      ["/changelog", "Changelog"],
    ]);
  });

  it("has no blogs without a blogPlugin or in standalone mode", () => {
    expect(getBlogs(withMeta({}))).toEqual([]);

    const standalone = withMeta({ plugins: [blogPlugin()] });
    standalone.__meta.mode = "standalone";
    expect(getBlogs(standalone)).toEqual([]);
  });

  it("rejects two blogs on the same path", () => {
    const config = withMeta({
      plugins: [blogPlugin(), blogPlugin({ path: "blog/" })],
    });

    expect(() => getBlogs(config)).toThrow(
      'Multiple blogs are configured with the path "/blog".',
    );
  });
});

describe("parsePostPath", () => {
  it.each([
    ["2024-05-01-launch.md", "launch", "2024-05-01"],
    ["2024-05-01_launch.mdx", "launch", "2024-05-01"],
    ["2024-05-01-launch/index.mdx", "launch", "2024-05-01"],
    ["news/2024-05-01-launch.md", "news/launch", "2024-05-01"],
    ["launch.md", "launch", undefined],
    ["launch/index.md", "launch", undefined],
    ["2024-05-01.md", "2024-05-01", "2024-05-01"],
    ["2024-05-01launch.md", "2024-05-01launch", undefined],
  ])("parses %s", (file, slug, date) => {
    expect(parsePostPath(file)).toEqual({ slug, date });
  });
});

describe("filterPostFiles", () => {
  it("keeps only the index of folder posts and skips _-prefixed paths", () => {
    expect(
      filterPostFiles([
        "2025-01-01-a.md",
        "2025-01-02-b/index.mdx",
        "2025-01-02-b/_snippet.mdx",
        "2025-01-02-b/README.md",
        "2025-01-02-b/notes/extra.md",
        "news/2025-01-03-c.md",
        "_drafts/d.md",
        "e/_partial.mdx",
        "index.md",
      ]),
    ).toEqual([
      "2025-01-01-a.md",
      "2025-01-02-b/index.mdx",
      "news/2025-01-03-c.md",
      "index.md",
    ]);
  });
});

describe("loadBlogPosts", () => {
  let tempDir: string;
  const originalNodeEnv = process.env.NODE_ENV;

  const writePost = async (relativePath: string, content: string) => {
    const absolute = path.join(tempDir, relativePath);
    await fs.mkdir(path.dirname(absolute), { recursive: true });
    await fs.writeFile(absolute, content);
  };

  const load = (
    blog: Parameters<typeof resolveBlogOptions>[0] = {},
    config: Record<string, unknown> = {},
  ) => loadBlogPosts(withMeta(config, tempDir), resolveBlogOptions(blog));

  beforeEach(async () => {
    tempDir = await fs.realpath(
      await fs.mkdtemp(path.join(os.tmpdir(), "zudoku-blog-test-")),
    );
  });

  afterEach(async () => {
    process.env.NODE_ENV = originalNodeEnv;
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("reads metadata from frontmatter, file name and content", async () => {
    await writePost(
      "blog/2024-01-15-hello-world.md",
      [
        "---",
        "authors: [jane]",
        "tags: [Release Notes, release notes, API]",
        "image: /hello.png",
        "---",
        "",
        "# Hello *World*",
        "",
        "<!-- hidden -->",
        "",
        "The first **paragraph**, with `code`.",
        "",
        "The second paragraph.",
      ].join("\n"),
    );

    const [post] = await load({
      authors: { jane: { name: "Jane Doe", title: "Engineer" } },
    });

    expect(post).toEqual({
      file: "blog/2024-01-15-hello-world.md",
      path: "/blog/hello-world",
      title: "Hello World",
      description: "The first paragraph, with code.",
      date: "2024-01-15T00:00:00.000Z",
      authors: [{ name: "Jane Doe", title: "Engineer" }],
      tags: [
        { label: "Release Notes", slug: "release-notes" },
        { label: "API", slug: "api" },
      ],
      readingTime: 1,
      image: "/hello.png",
    } satisfies BlogPostSource);
  });

  it("prefers frontmatter over values derived from the file", async () => {
    await writePost(
      "blog/2024-01-15-hello/index.mdx",
      [
        "---",
        "title: From frontmatter",
        "description: Described",
        "date: 2023-06-01T12:30:00Z",
        "slug: /custom/slug/",
        "authors:",
        "  - name: Inline Author",
        "    url: https://example.com",
        "  - unknown",
        "---",
        "",
        "# Content title",
        "",
        "Content paragraph.",
      ].join("\n"),
    );

    const [post] = await load({ path: "news/" });

    expect(post).toMatchObject({
      path: "/news/custom/slug",
      title: "From frontmatter",
      description: "Described",
      date: "2023-06-01T12:30:00.000Z",
      authors: [
        { name: "Inline Author", url: "https://example.com" },
        { name: "unknown" },
      ],
    });
  });

  it("skips MDX imports and expressions when deriving the excerpt", async () => {
    await writePost(
      "blog/2024-01-15-mdx.mdx",
      [
        'import { Thing } from "./thing";',
        "",
        "export const meta = {};",
        "",
        "{/* a comment */}",
        "",
        "<!-- an HTML comment -->",
        "",
        "Hello <Thing>inline</Thing> world.",
      ].join("\n"),
    );

    const [post] = await load();

    expect(post?.title).toBe("mdx");
    expect(post?.description).toBe("Hello inline world.");
  });

  it("resolves image paths against the base path and site URL", async () => {
    await writePost(
      "blog/2024-01-15-images.md",
      [
        "---",
        "image: /cover.png",
        "authors:",
        "  - jane",
        "  - name: Remote",
        "    imageUrl: https://cdn.example.com/remote.png",
        "---",
        "Hello",
      ].join("\n"),
    );

    const [post] = await load(
      { authors: { jane: { name: "Jane", imageUrl: "/jane.png" } } },
      { basePath: "/docs", canonicalUrlOrigin: "https://example.com" },
    );

    expect(post?.image).toBe("https://example.com/docs/cover.png");
    expect(post?.authors.map((author) => author.imageUrl)).toEqual([
      "/docs/jane.png",
      "https://cdn.example.com/remote.png",
    ]);
  });

  it("removes nested HTML comments before parsing MDX", async () => {
    await writePost(
      "blog/2024-01-15-comments.mdx",
      "<!<!-- a -->-- b -->\n\nVisible paragraph.",
    );

    const [post] = await load();

    expect(post?.description).toBe("Visible paragraph.");
  });

  it("skips posts on the paths of the blog's own pages", async () => {
    await writePost("blog/tags.md", "Tags");
    await writePost("blog/page/2.md", "Page");
    await writePost("blog/rss.xml.md", "Feed");
    await writePost("blog/2024-01-01-slug.md", "---\nslug: tags/api\n---\nTag");
    await writePost("blog/2024-01-02-ok.md", "Ok");

    const posts = await load();

    expect(posts.map((post) => post.path)).toEqual(["/blog/ok"]);
  });

  it("dates undated posts by the commit that added them", async () => {
    await writePost("blog/undated.md", "Hello");
    const git = (...args: string[]) =>
      spawnSync(
        "git",
        [
          "-c",
          "user.name=Test",
          "-c",
          "user.email=test@example.com",
          "-c",
          "commit.gpgsign=false",
          ...args,
        ],
        {
          cwd: tempDir,
          env: {
            ...process.env,
            GIT_AUTHOR_DATE: "2021-03-04T05:06:07Z",
            GIT_COMMITTER_DATE: "2021-03-04T05:06:07Z",
          },
        },
      );
    git("init", "-q");
    git("add", ".");
    git("commit", "-q", "-m", "Add post");

    const [post] = await load();

    expect(post?.date).toBe("2021-03-04T05:06:07.000Z");
  });

  it("maps post files to their routes for links between posts", async () => {
    await writePost("blog/2025-01-01-a.md", "A");
    await writePost("blog/2025-01-02-b/index.mdx", "B");

    const routesByFile = await getBlogRoutesByFile(
      withMeta({ plugins: [blogPlugin()] }, tempDir),
    );
    const rewrite = (url: string, file: string) => {
      const link: Link = { type: "link", url, children: [] };
      const tree: Root = {
        type: "root",
        children: [{ type: "paragraph", children: [link] }],
      };
      remarkLinkRewrite("", routesByFile)(
        tree,
        new VFile({ path: path.join(tempDir, file) }),
      );
      return link.url;
    };

    expect(rewrite("./2025-01-02-b/index.mdx", "blog/2025-01-01-a.md")).toBe(
      "/blog/b",
    );
    expect(
      rewrite("../2025-01-01-a.md#intro", "blog/2025-01-02-b/index.mdx"),
    ).toBe("/blog/a#intro");
  });

  it("estimates the reading time", async () => {
    const words = Array.from({ length: 1000 }, () => "word").join(" ");
    await writePost("blog/2024-01-15-long.md", words);

    const [post] = await load();

    expect(post?.readingTime).toBe(5);
  });

  it("sorts posts newest first", async () => {
    await writePost("blog/2024-01-01-old.md", "Old");
    await writePost("blog/2024-03-01-new.md", "New");
    await writePost("blog/2024-02-01-b.md", "B");
    await writePost("blog/2024-02-01-a.md", "A");

    const posts = await load();

    expect(posts.map((post) => post.path)).toEqual([
      "/blog/new",
      "/blog/a",
      "/blog/b",
      "/blog/old",
    ]);
  });

  it("only includes drafts in development", async () => {
    await writePost("blog/2024-01-01-draft.md", "---\ndraft: true\n---\nWIP");

    process.env.NODE_ENV = "production";
    expect(await load()).toEqual([]);

    process.env.NODE_ENV = "development";
    expect(await load()).toMatchObject([{ path: "/blog/draft", draft: true }]);
  });

  it("keeps the newest post when two resolve to the same path", async () => {
    await writePost("blog/2024-01-01-hello.md", "First");
    await writePost("blog/2024-02-01-hello.md", "Second");

    const posts = await load();

    expect(posts).toHaveLength(1);
    expect(posts[0]?.file).toBe("blog/2024-02-01-hello.md");
  });

  it("globs custom file patterns", async () => {
    await writePost("content/posts/2024-01-01-hello.md", "Hello");
    await writePost("blog/2024-01-01-ignored.md", "Ignored");

    const posts = await load({ files: "content/posts/**/*.md" });

    expect(posts.map((post) => post.path)).toEqual(["/blog/hello"]);
  });
});

const post = (overrides: Partial<BlogPost> = {}): BlogPost => ({
  path: "/blog/hello",
  title: "Hello",
  date: "2024-01-15T00:00:00.000Z",
  authors: [],
  tags: [],
  readingTime: 1,
  ...overrides,
});

describe("generateRssFeed", () => {
  it("links posts absolutely and escapes text", () => {
    const blog = resolveBlogOptions({
      title: "News & Updates",
      description: "All <the> news",
    });

    const feed = generateRssFeed({
      siteUrl: "https://example.com",
      basePath: "/docs",
      blog,
      posts: [
        post({
          title: "Tom & Jerry",
          description: 'Say "hi"',
          authors: [{ name: "Jane" }],
          tags: [{ label: "API", slug: "api" }],
        }),
      ],
    });

    expect(feed).toContain("<title>News &amp; Updates</title>");
    expect(feed).toContain("<description>All &lt;the&gt; news</description>");
    expect(feed).toContain("<link>https://example.com/docs/blog</link>");
    expect(feed).toContain(
      '<atom:link href="https://example.com/docs/blog/rss.xml" rel="self" type="application/rss+xml"/>',
    );
    expect(feed).toContain("<title>Tom &amp; Jerry</title>");
    expect(feed).toContain("<link>https://example.com/docs/blog/hello</link>");
    expect(feed).toContain("<pubDate>Mon, 15 Jan 2024 00:00:00 GMT</pubDate>");
    expect(feed).toContain("<description>Say &quot;hi&quot;</description>");
    expect(feed).toContain("<dc:creator>Jane</dc:creator>");
    expect(feed).toContain("<category>API</category>");
  });
});

describe("blogPlugin", () => {
  const posts = [
    post({ path: "/blog/c", tags: [{ label: "API", slug: "api" }] }),
    post({ path: "/blog/b" }),
    post({ path: "/blog/a" }),
  ];
  const loadPosts = vi.fn(async () => posts);

  beforeEach(() => {
    loadPosts.mockClear();
    manifests["/blog"] = {
      tags: [{ label: "API", slug: "api" }],
      postImports: Object.fromEntries(
        posts.map((p) => [p.path, () => Promise.resolve({} as never)]),
      ),
      loadPosts,
    };
  });

  afterEach(() => {
    delete manifests["/blog"];
  });

  it("creates a route for every list page, tag and post", () => {
    const plugin = blogPlugin({ postsPerPage: 2 });
    const routes = isNavigationPlugin(plugin) ? plugin.getRoutes() : [];

    expect(routesToPaths(routes).sort()).toEqual(
      [
        "/blog",
        "/blog/page/2",
        "/blog/tags",
        "/blog/tags/api",
        "/blog/c",
        "/blog/b",
        "/blog/a",
      ].sort(),
    );
  });

  it("has no routes before its posts were generated", () => {
    const plugin = blogPlugin({ path: "/changelog" });

    expect(isNavigationPlugin(plugin) && plugin.getRoutes()).toEqual([]);
  });

  it("lists the most recent posts in the sidebar of blog pages", async () => {
    const plugin = blogPlugin({ sidebar: { count: 2 } });
    if (!isNavigationPlugin(plugin)) throw new Error("not a navigation plugin");

    const context = {} as never;
    expect(await plugin.getNavigation?.("/docs/intro", context)).toEqual([]);
    expect(await plugin.getNavigation?.("/blog/a", context)).toEqual([
      { type: "section", label: "Recent posts" },
      { type: "link", to: "/blog/c", label: "Hello" },
      { type: "link", to: "/blog/b", label: "Hello" },
    ]);
  });

  it("has no sidebar when it is disabled", async () => {
    const plugin = blogPlugin({ sidebar: false });
    if (!isNavigationPlugin(plugin)) throw new Error("not a navigation plugin");

    expect(await plugin.getNavigation?.("/blog", {} as never)).toEqual([]);
    expect(loadPosts).not.toHaveBeenCalled();
  });
});
