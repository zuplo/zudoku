import { Head } from "@unhead/react";
import { RssIcon } from "lucide-react";
import { Link } from "react-router";
import { Heading } from "../../components/Heading.js";
import { Pagination } from "../../components/Pagination.js";
import { joinUrl } from "../../util/joinUrl.js";
import {
  BlogFeedLink,
  PostAuthors,
  PostMeta,
  PostTags,
} from "./BlogComponents.js";
import {
  type BlogPluginOptions,
  type BlogPost,
  type BlogTag,
  getBlogPagePath,
} from "./index.js";

const PostCard = ({
  post,
  options,
}: {
  post: BlogPost;
  options: BlogPluginOptions;
}) => (
  <article className="flex flex-col gap-3 py-8 first:pt-0">
    <PostMeta post={post} showReadingTime={options.showReadingTime} />
    <h2 className="text-2xl font-bold tracking-tight">
      <Link to={post.path} className="hover:underline underline-offset-4">
        {post.title}
      </Link>
    </h2>
    {post.description && (
      <p className="text-muted-foreground line-clamp-3">{post.description}</p>
    )}
    <PostAuthors authors={post.authors} compact />
    <div className="flex flex-wrap items-center justify-between gap-4">
      <PostTags tags={post.tags} blogPath={options.path} />
      <Link
        to={post.path}
        className="text-sm font-medium text-primary hover:underline underline-offset-4 ms-auto"
        aria-label={`Read more about ${post.title}`}
      >
        Read more →
      </Link>
    </div>
  </article>
);

export const BlogListPage = ({
  options,
  posts,
  page = 1,
  pageCount = 1,
  tag,
}: {
  options: BlogPluginOptions;
  posts: BlogPost[];
  page?: number;
  pageCount?: number;
  tag?: BlogTag;
}) => {
  const title = tag ? `Posts tagged “${tag.label}”` : options.title;
  const pageTitle = page > 1 ? `${title} – Page ${page}` : title;

  return (
    <section className="w-full max-w-3xl mx-auto pt-(--padding-content-top) pb-12">
      <Head>
        <title>{pageTitle}</title>
        {!tag && options.description && (
          <meta name="description" content={options.description} />
        )}
      </Head>
      <BlogFeedLink feedUrl={options.feedUrl} />

      <header className="flex flex-col gap-2 pb-8 mb-8 border-b">
        <div className="flex items-start justify-between gap-4">
          <Heading level={1} className="tracking-tight">
            {title}
          </Heading>
          {options.feedUrl && (
            <a
              href={options.feedUrl}
              className="mt-2 text-muted-foreground hover:text-foreground"
              aria-label="RSS feed"
              title="RSS feed"
            >
              <RssIcon size={20} aria-hidden="true" />
            </a>
          )}
        </div>
        {tag ? (
          <p className="text-muted-foreground">
            {posts.length} {posts.length === 1 ? "post" : "posts"} ·{" "}
            <Link
              to={joinUrl(options.path, "tags")}
              className="hover:underline underline-offset-4"
            >
              View all tags
            </Link>
          </p>
        ) : (
          options.description && (
            <p className="text-lg text-muted-foreground">
              {options.description}
            </p>
          )
        )}
      </header>

      {posts.length === 0 ? (
        <p className="text-muted-foreground">No posts yet.</p>
      ) : (
        <div className="divide-y" data-pagefind-ignore="all">
          {posts.map((post) => (
            <PostCard key={post.path} post={post} options={options} />
          ))}
        </div>
      )}

      {pageCount > 1 && (
        <nav aria-label="Blog pages" className="border-t pt-6 mt-2">
          <Pagination
            prev={
              page > 1
                ? {
                    to: getBlogPagePath(options.path, page - 1),
                    label: "Newer posts",
                  }
                : undefined
            }
            next={
              page < pageCount
                ? {
                    to: getBlogPagePath(options.path, page + 1),
                    label: "Older posts",
                  }
                : undefined
            }
          />
        </nav>
      )}
    </section>
  );
};
