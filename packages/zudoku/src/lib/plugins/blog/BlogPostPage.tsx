import { useMDXComponents } from "@mdx-js/react";
import { Head } from "@unhead/react";
import { useEffect } from "react";
import { Link } from "react-router";
import { CategoryHeading } from "../../components/CategoryHeading.js";
import { DeveloperHint } from "../../components/DeveloperHint.js";
import { Heading } from "../../components/Heading.js";
import { Toc } from "../../components/navigation/Toc.js";
import { PagefindSearchMeta } from "../../components/PagefindSearchMeta.js";
import { Pagination } from "../../components/Pagination.js";
import { Typography } from "../../components/Typography.js";
import type { MdxComponentsType } from "../../util/MdxComponents.js";
import type { MDXImport } from "../markdown/index.js";
import {
  BlogFeedLink,
  PostAuthors,
  PostMeta,
  PostTags,
} from "./BlogComponents.js";
import type { BlogPageOptions, BlogPost } from "./options.js";

const MarkdownHeadings = {
  h2: ({ children, id }) => (
    <Heading level={2} id={id} registerNavigationAnchor>
      {children}
    </Heading>
  ),
  h3: ({ children, id }) => (
    <Heading level={3} id={id} registerNavigationAnchor>
      {children}
    </Heading>
  ),
} satisfies MdxComponentsType;

// Without a frontmatter title, the post's title is its first `# Heading`, which
// the page header already renders.
const HiddenHeading = () => null;

export const BlogPostPage = ({
  options,
  post,
  newer,
  older,
  mdxComponent: MdxComponent,
  frontmatter = {},
  tableOfContents,
  __filepath,
}: Omit<MDXImport, "default" | "excerpt"> & {
  options: BlogPageOptions;
  post: BlogPost;
  newer?: BlogPost;
  older?: BlogPost;
  mdxComponent: MDXImport["default"];
}) => {
  const description = frontmatter.seo?.description ?? post.description;
  const showToc = frontmatter.toc ?? true;
  const tocEntries =
    tableOfContents.find((item) => item.depth === 1)?.children ??
    tableOfContents.filter((item) => item.depth === 2);

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      window.__getReactRefreshIgnoredExports = ({ id }) => {
        if (!id.endsWith(__filepath)) return;

        return ["frontmatter", "tableOfContents"];
      };

      return () => {
        window.__getReactRefreshIgnoredExports = undefined;
      };
    }
  }, [__filepath]);

  return (
    <div
      className="grid grid-cols-1 gap-8 justify-between xl:grid-cols-(--sidecar-grid-cols)"
      data-pagefind-filter="section:blog"
      data-pagefind-meta="section:blog"
    >
      <Head>
        <title>{frontmatter.seo?.title ?? post.title}</title>
        {description && <meta name="description" content={description} />}
        <meta property="og:type" content="article" />
        <meta property="article:published_time" content={post.date} />
        {post.image && <meta property="og:image" content={post.image} />}
        {post.tags.map((tag) => (
          <meta key={tag.slug} property="article:tag" content={tag.label} />
        ))}
      </Head>
      <BlogFeedLink feedUrl={options.feedUrl} />

      <Typography className="max-w-full flex-1 shrink pt-(--padding-content-top) xl:w-full xl:max-w-3xl xl:mx-auto">
        <article>
          <header className="not-prose flex flex-col gap-3 mb-10">
            <CategoryHeading>
              <Link to={options.path}>{options.title}</Link>
            </CategoryHeading>
            <PagefindSearchMeta name="category">
              {options.title}
            </PagefindSearchMeta>
            <Heading level={1} className="tracking-tight">
              {post.title}
            </Heading>
            <PostMeta post={post} showReadingTime={options.showReadingTime} />
            <PostAuthors authors={post.authors} />
          </header>

          {post.draft && (
            <DeveloperHint>
              This post is a draft and is not visible in production.
            </DeveloperHint>
          )}

          <MdxComponent
            components={{
              ...useMDXComponents(),
              ...MarkdownHeadings,
              ...(frontmatter.title ? {} : { h1: HiddenHeading }),
            }}
          />

          {post.tags.length > 0 && (
            <footer className="mt-12">
              <PostTags tags={post.tags} blogPath={options.path} />
            </footer>
          )}
        </article>

        {(newer || older) && (
          <nav aria-label="More posts">
            <div className="h-px bg-border mt-8 mb-6" />
            <Pagination
              prev={newer ? { to: newer.path, label: newer.title } : undefined}
              next={older ? { to: older.path, label: older.title } : undefined}
              className="mb-10"
            />
          </nav>
        )}
      </Typography>
      {showToc && tocEntries.length > 0 && (
        <div className="hidden xl:block" data-pagefind-ignore="all">
          <Toc entries={tocEntries} />
        </div>
      )}
    </div>
  );
};
