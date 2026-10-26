---
title: Blog
navigation_icon: newspaper
---

Zudoku can publish a blog next to your documentation and API reference. Posts are Markdown or MDX
files in a folder of your project: add a file and it shows up in the blog, with a paginated index,
tag pages, a "Recent posts" sidebar and an RSS feed.

:::caution{title="Beta"}

The blog plugin is in beta. Its options, frontmatter fields and generated URLs may still change in a
minor release. Feedback is welcome in [GitHub issues](https://github.com/zuplo/zudoku/issues).

:::

## Enable the blog

Add the blog plugin to the `plugins` of your config. Every option has a default:

```tsx title="zudoku.config.tsx"
import { blogPlugin } from "zudoku/plugins/blog";

export default {
  plugins: [blogPlugin()],
};
```

Then put your posts in the `blog` folder at the root of your project:

```text title="File tree"
blog/
├── 2025-03-14-hello-world.md        → /blog/hello-world
├── 2025-04-02-launch-week/
│   ├── index.mdx                    → /blog/launch-week
│   └── screenshot.png
└── release-notes/
    └── 2025-05-20-v2.md             → /blog/release-notes/v2
```

To link to the blog from the top navigation, add a link to your [navigation](./navigation.mdx):

```tsx title="zudoku.config.tsx"
export default {
  navigation: [
    // ...
    { type: "link", to: "/blog", label: "Blog", icon: "newspaper" },
  ],
};
```

## Writing posts

The file name sets the URL and the date of a post: a `YYYY-MM-DD-` prefix is the publish date and
the rest is the slug. A post can also be a folder with an `index.md` or `index.mdx` file, which
keeps its images next to it. Folders that aren't dated stay part of the URL.

Some files are not posts:

- Other Markdown files in a post's folder, such as partials imported by its `index.mdx` or a
  `README.md`
- Files and folders whose name starts with `_`, e.g. `_drafts/` or `_snippet.mdx`
- Posts whose URL is taken by the blog's own pages: `<path>/tags`, `<path>/tags/*`, `<path>/page/*`
  and `<path>/rss.xml`. These are skipped with a warning.

Link to other posts by their file, e.g. `[Launch](./2025-04-02-launch-week/index.mdx)`, and the link
points to the post's URL.

Posts support everything [Markdown and MDX pages](../markdown/overview.md) do, including
[admonitions](../markdown/admonitions.md), [code blocks](../markdown/code-blocks.md) and React
components.

```md title="blog/2025-03-14-hello-world.md"
---
title: Hello World
description: The first post on our new developer blog.
authors: [jane]
tags: [Announcements, API]
---

This paragraph is the excerpt shown on the blog index page.

## A section

The post continues here.
```

### Frontmatter

| Field         | Description                                                                                                                                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `title`       | Title of the post. Defaults to the first `# Heading`, which is then not repeated in the post body.                                                                                                                 |
| `description` | Shown on the index page, in the feed and as the meta description. Defaults to the first paragraph.                                                                                                                 |
| `date`        | Publish date, e.g. `2025-03-14` or `2025-03-14T09:00:00Z`. Defaults to the date in the file name, then the date of the commit that added the file (needs the full git history), then the file's modification time. |
| `slug`        | Overrides the URL: `slug: launch` serves the post at `/blog/launch`.                                                                                                                                               |
| `authors`     | Author keys from [`authors`](#authors), or inline objects such as `{ name: "Jane Doe", title: "Engineer" }`.                                                                                                       |
| `tags`        | List of tags. Each tag gets a page listing its posts.                                                                                                                                                              |
| `image`       | Image used as `og:image` when the post is shared. An absolute URL or a path in the `public` folder, e.g. `/cover.png`.                                                                                             |
| `draft`       | When `true`, the post is only shown in development.                                                                                                                                                                |
| `toc`         | Set to `false` to hide the table of contents.                                                                                                                                                                      |
| `seo`         | `title` and `description` that override the browser title and meta description only.                                                                                                                               |

Posts are sorted by date, newest first.

## Plugin options

```tsx title="zudoku.config.tsx"
import { blogPlugin } from "zudoku/plugins/blog";

export default {
  plugins: [
    blogPlugin({
      files: "/blog/**/*.{md,mdx}",
      path: "/blog",
      title: "Blog",
      description: "News and updates from the team.",
      postsPerPage: 10,
      showReadingTime: true,
      authors: {
        jane: {
          name: "Jane Doe",
          title: "Developer Advocate",
          url: "https://example.com/jane",
          imageUrl: "https://example.com/jane.png",
        },
      },
      sidebar: { title: "Recent posts", count: 5 },
      feed: true,
    }),
  ],
};
```

### `files`

**Type:** `string | string[]`  
**Default:** `"/blog/**/*.{md,mdx}"`

Glob patterns for the post files. Keep them outside of [`docs.files`](./docs.md#files) so a post
isn't also published as a documentation page.

### `path`

**Type:** `string`  
**Default:** `"/blog"`

The route the blog is served under. The index is at `path`, further index pages at `path/page/2`,
tags at `path/tags` and posts at `path/<slug>`.

### `title` and `description`

**Type:** `string`  
**Default:** `"Blog"` and none

Heading and introduction of the index page. Both are also used for the RSS feed.

### `postsPerPage`

**Type:** `number`  
**Default:** `10`

Number of posts on each page of the index.

### `showReadingTime`

**Type:** `boolean`  
**Default:** `true`

Shows an estimated reading time next to the date of each post.

### `authors`

**Type:** `Record<string, { name: string; title?: string; url?: string; imageUrl?: string }>`  
**Default:** `{}`

Authors that posts reference by key in their `authors` frontmatter, so their details are kept in one
place. Authors without an `imageUrl` show their initial instead.

### `sidebar`

**Type:** `{ title?: string; count?: number } | false`  
**Default:** `{ title: "Recent posts", count: 5 }`

Lists the most recent posts in the sidebar of all blog pages. Set to `false` to hide it.

### `feed`

**Type:** `boolean`  
**Default:** on when a site URL is configured

Generates an RSS feed at `<path>/rss.xml` and links it from every blog page. Feeds need absolute
links, so the site URL is taken from [`canonicalUrlOrigin`](./overview.md#canonicalurlorigin) or
[`sitemap.siteUrl`](./overview.md#sitemap). Without either, no feed is generated.

## Multiple blogs

Add the plugin once per blog, each with its own `files` and `path`, for example a blog and a
changelog:

```tsx title="zudoku.config.tsx"
import { blogPlugin } from "zudoku/plugins/blog";

export default {
  plugins: [
    blogPlugin({ files: "/blog/**/*.{md,mdx}", path: "/blog" }),
    blogPlugin({
      files: "/changelog/**/*.{md,mdx}",
      path: "/changelog",
      title: "Changelog",
      sidebar: false,
    }),
  ],
};
```
