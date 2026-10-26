import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { validateConfig } from "../config/validators/ZudokuConfig.js";
import { isNavigationPlugin } from "../lib/core/plugins.js";
import {
  type BlogPluginOptions,
  type BlogPost,
  blogPlugin,
} from "../lib/plugins/blog/index.js";
import {
  type BlogPostSource,
  generateRssFeed,
  loadBlogPosts,
  parsePostPath,
} from "./plugin-blog.js";
import { routesToPaths } from "./prerender/utils.js";

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

describe("loadBlogPosts", () => {
  let tempDir: string;
  const originalNodeEnv = process.env.NODE_ENV;

  const writePost = async (relativePath: string, content: string) => {
    const absolute = path.join(tempDir, relativePath);
    await fs.mkdir(path.dirname(absolute), { recursive: true });
    await fs.writeFile(absolute, content);
  };

  const load = (
    blog: Record<string, unknown> = {},
    config: Record<string, unknown> = {},
  ) =>
    loadBlogPosts({
      ...validateConfig({ ...config, blog }),
      __meta: {
        rootDir: tempDir,
        moduleDir: path.join(tempDir, "node_modules"),
        mode: "module",
        dependencies: [],
        configPath: path.join(tempDir, "zudoku.config.ts"),
      },
    });

  beforeEach(async () => {
    tempDir = await fs.realpath(
      await fs.mkdtemp(path.join(os.tmpdir(), "zudoku-blog-test-")),
    );
  });

  afterEach(async () => {
    process.env.NODE_ENV = originalNodeEnv;
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("returns no posts when the blog is not configured", async () => {
    await writePost("blog/2024-01-01-hello.md", "Hello");

    const config = validateConfig({});
    expect(
      await loadBlogPosts({ ...config, __meta: { rootDir: tempDir } } as never),
    ).toEqual([]);
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
    const blog = validateConfig({
      blog: { title: "News & Updates", description: "All <the> news" },
    }).blog;
    if (!blog) throw new Error("blog config missing");

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
  const createPlugin = (overrides: Partial<BlogPluginOptions> = {}) => {
    const posts = [
      post({ path: "/blog/c", tags: [{ label: "API", slug: "api" }] }),
      post({ path: "/blog/b" }),
      post({ path: "/blog/a" }),
    ];

    return blogPlugin({
      path: "/blog",
      title: "Blog",
      postsPerPage: 2,
      showReadingTime: true,
      sidebar: { title: "Recent posts", count: 2 },
      tags: [{ label: "API", slug: "api" }],
      postImports: Object.fromEntries(
        posts.map((p) => [p.path, () => Promise.resolve({} as never)]),
      ),
      loadPosts: vi.fn(async () => posts),
      ...overrides,
    });
  };

  it("creates a route for every list page, tag and post", () => {
    const plugin = createPlugin();
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

  it("lists the most recent posts in the sidebar of blog pages", async () => {
    const plugin = createPlugin();
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
    const loadPosts = vi.fn(async () => []);
    const plugin = createPlugin({ sidebar: false, loadPosts });
    if (!isNavigationPlugin(plugin)) throw new Error("not a navigation plugin");

    expect(await plugin.getNavigation?.("/blog", {} as never)).toEqual([]);
    expect(loadPosts).not.toHaveBeenCalled();
  });
});
