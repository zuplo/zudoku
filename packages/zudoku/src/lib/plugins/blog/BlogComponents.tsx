import { Head } from "@unhead/react";
import { Link } from "react-router";
import { Badge } from "../../ui/Badge.js";
import { cn } from "../../util/cn.js";
import {
  type BlogAuthor,
  type BlogPost,
  type BlogTag,
  getBlogTagPath,
} from "./index.js";

export const BlogFeedLink = ({ feedUrl }: { feedUrl?: string }) =>
  feedUrl ? (
    <Head>
      <link rel="alternate" type="application/rss+xml" href={feedUrl} />
    </Head>
  ) : null;

// Pinned to UTC so the prerendered day matches the client render; a local
// timezone would shift the day near a UTC boundary and cause a hydration error.
export const formatPostDate = (date: string) =>
  new Date(date).toLocaleDateString("en-US", {
    dateStyle: "long",
    timeZone: "UTC",
  });

export const PostMeta = ({
  post,
  showReadingTime,
  className,
}: {
  post: BlogPost;
  showReadingTime: boolean;
  className?: string;
}) => (
  <div
    className={cn(
      "flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground",
      className,
    )}
  >
    <time dateTime={post.date}>{formatPostDate(post.date)}</time>
    {showReadingTime && (
      <>
        <span aria-hidden="true">·</span>
        <span>{post.readingTime} min read</span>
      </>
    )}
    {post.draft && <Badge variant="warning">Draft</Badge>}
  </div>
);

const AuthorAvatar = ({
  author,
  className,
}: {
  author: BlogAuthor;
  className?: string;
}) =>
  author.imageUrl ? (
    <img
      src={author.imageUrl}
      alt=""
      className={cn("rounded-full object-cover m-0", className)}
    />
  ) : (
    <span
      aria-hidden="true"
      className={cn(
        "rounded-full bg-muted text-muted-foreground grid place-items-center font-semibold",
        className,
      )}
    >
      {author.name.trim().charAt(0).toUpperCase()}
    </span>
  );

export const PostAuthors = ({
  authors,
  compact = false,
}: {
  authors: BlogAuthor[];
  compact?: boolean;
}) => {
  if (authors.length === 0) return null;

  return (
    <ul className="not-prose flex flex-wrap gap-x-6 gap-y-3">
      {authors.map((author) => (
        <li key={author.name} className="flex items-center gap-2.5">
          <AuthorAvatar
            author={author}
            className={compact ? "size-6 text-xs" : "size-10 text-sm"}
          />
          <div className="flex flex-col text-sm leading-tight">
            {author.url ? (
              <a
                href={author.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:underline"
              >
                {author.name}
              </a>
            ) : (
              <span className="font-medium">{author.name}</span>
            )}
            {!compact && author.title && (
              <span className="text-muted-foreground">{author.title}</span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
};

export const PostTags = ({
  tags,
  blogPath,
}: {
  tags: BlogTag[];
  blogPath: string;
}) => {
  if (tags.length === 0) return null;

  return (
    <ul className="not-prose flex flex-wrap gap-2" aria-label="Tags">
      {tags.map((tag) => (
        <li key={tag.slug}>
          <Badge variant="outline" asChild>
            <Link to={getBlogTagPath(blogPath, tag)}>{tag.label}</Link>
          </Badge>
        </li>
      ))}
    </ul>
  );
};
