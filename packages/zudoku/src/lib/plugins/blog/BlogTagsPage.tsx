import { Head } from "@unhead/react";
import { Link } from "react-router";
import { Heading } from "../../components/Heading.js";
import { Badge } from "../../ui/Badge.js";
import { BlogFeedLink } from "./BlogComponents.js";
import {
  type BlogPageOptions,
  type BlogPost,
  getBlogTagPath,
} from "./options.js";

export const BlogTagsPage = ({
  options,
  posts,
}: {
  options: BlogPageOptions;
  posts: BlogPost[];
}) => {
  const counts = new Map<string, number>();
  for (const tag of posts.flatMap((post) => post.tags)) {
    counts.set(tag.slug, (counts.get(tag.slug) ?? 0) + 1);
  }

  return (
    // Only the posts themselves belong in search results
    <section
      className="w-full max-w-3xl mx-auto pt-(--padding-content-top) pb-12"
      data-pagefind-ignore="all"
    >
      <Head>
        <title>{`Tags – ${options.title}`}</title>
      </Head>
      <BlogFeedLink feedUrl={options.feedUrl} />

      <header className="flex flex-col gap-2 pb-8 mb-8 border-b">
        <Heading level={1} className="tracking-tight">
          Tags
        </Heading>
        <p className="text-muted-foreground">
          <Link
            to={options.path}
            className="hover:underline underline-offset-4"
          >
            ← {options.title}
          </Link>
        </p>
      </header>

      {options.tags.length === 0 ? (
        <p className="text-muted-foreground">No tags yet.</p>
      ) : (
        <ul className="flex flex-wrap gap-3">
          {options.tags.map((tag) => (
            <li key={tag.slug}>
              <Badge variant="outline" className="text-sm px-3 py-1" asChild>
                <Link to={getBlogTagPath(options.path, tag)}>
                  {tag.label}
                  <span className="text-muted-foreground">
                    {counts.get(tag.slug) ?? 0}
                  </span>
                </Link>
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
