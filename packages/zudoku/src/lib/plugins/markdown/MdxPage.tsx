import { useMDXComponents } from "@mdx-js/react";
import slugify from "@sindresorhus/slugify";
import { Helmet } from "@zudoku/react-helmet-async";
import { type PropsWithChildren, useEffect } from "react";
import { Link, useHref } from "react-router";
import { CategoryHeading } from "../../components/CategoryHeading.js";
import { Heading } from "../../components/Heading.js";
import { ProseClasses } from "../../components/Markdown.js";
import {
  useCurrentItem,
  usePrevNext,
} from "../../components/navigation/utils.js";
import type { MdxComponentsType } from "../../util/MdxComponents.js";
import { cn } from "../../util/cn.js";
import { Toc } from "./Toc.js";
import { type MarkdownPluginDefaultOptions, type MDXImport } from "./index.js";

declare global {
  interface Window {
    __getReactRefreshIgnoredExports?: (args: {
      id: string;
    }) => string[] | undefined;
  }
}

const MarkdownHeadings = {
  h2: ({ children, id }) => (
    <Heading level={2} id={id} registerSidebarAnchor>
      {children}
    </Heading>
  ),
  h3: ({ children, id }) => (
    <Heading level={3} id={id} registerSidebarAnchor>
      {children}
    </Heading>
  ),
} satisfies MdxComponentsType;

export const MdxPage = ({
  mdxComponent: MdxComponent,
  file,
  frontmatter = {},
  defaultOptions,
  tableOfContents,
  excerpt,
}: PropsWithChildren<
  Omit<MDXImport, "default"> & {
    file: string;
    mdxComponent: MDXImport["default"];
    defaultOptions?: MarkdownPluginDefaultOptions;
  }
>) => {
  const categoryTitle = useCurrentItem()?.categoryLabel;
  let canonicalUrl = null;
  const path = useHref("");
  if (typeof window !== "undefined") {
    const domain = window.location.origin;
    canonicalUrl = `${domain}${path}`;
  }

  const title = frontmatter.title;
  const category = frontmatter.category ?? categoryTitle;
  const hideToc = frontmatter.toc === false || defaultOptions?.toc === false;
  const pageTitle =
    tableOfContents.find((item) => item.depth === 1)?.value ?? title;
  const hidePager =
    frontmatter.disablePager ?? defaultOptions?.disablePager ?? false;

  const tocEntries =
    tableOfContents.find((item) => item.depth === 1)?.children ??
    // if `title` is provided by frontmatter it does not appear in the table of contents
    tableOfContents.filter((item) => item.depth === 2);

  const showToc = !hideToc && tocEntries.length > 0;

  const { prev, next } = usePrevNext();

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      window.__getReactRefreshIgnoredExports = ({ id }) => {
        if (!id.endsWith(file)) return;

        return ["frontmatter", "tableOfContents"];
      };

      return () => {
        window.__getReactRefreshIgnoredExports = undefined;
      };
    }
  }, [file]);

  return (
    <div
      className="grid grid-cols-1 xl:grid-cols-[--sidecar-grid-cols] gap-8 justify-between"
      data-pagefind-filter="section:markdown"
      data-pagefind-meta="section:markdown"
    >
      <Helmet>
        <title>{pageTitle}</title>
        {excerpt && <meta name="description" content={excerpt} />}
        {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      </Helmet>
      <div
        className={cn(
          ProseClasses,
          "max-w-full xl:w-full xl:max-w-3xl flex-1 flex-shrink pt-[--padding-content-top] pb-[--padding-content-bottom]",
        )}
      >
        {(category || title) && (
          <header>
            {category && <CategoryHeading>{category}</CategoryHeading>}
            {title && (
              <Heading level={1} id={slugify(title)}>
                {title}
              </Heading>
            )}
          </header>
        )}
        <MdxComponent
          components={{ ...useMDXComponents(), ...MarkdownHeadings }}
        />
        {!hidePager && (
          <>
            <hr />
            <div className="not-prose flex flex-wrap items-center justify-between gap-2 lg:gap-8">
              {prev ? (
                <Link
                  to={prev.id}
                  className="flex flex-col items-stretch gap-2 flex-1 min-w-max border rounded px-6 py-4 text-start hover:border-primary/85 transition shadow-sm hover:shadow-md"
                  title={prev.label}
                >
                  <div className="text-sm text-muted-foreground">
                    ← Previous page
                  </div>
                  <div className="text-lg text-primary truncate">
                    {prev.label}
                  </div>
                </Link>
              ) : (
                <div className="flex-1" />
              )}
              {next ? (
                <Link
                  to={next.id}
                  className="flex flex-col items-stretch gap-2 flex-1 min-w-max border rounded px-6 py-4 text-end hover:border-primary/85 transition shadow-sm hover:shadow-md"
                  title={next.label}
                >
                  <div className="text-sm text-muted-foreground">
                    Next page →
                  </div>
                  <div className="text-lg text-primary truncate">
                    {next.label}
                  </div>
                </Link>
              ) : (
                <div className="flex-1" />
              )}
            </div>
          </>
        )}
      </div>
      <div className="hidden xl:block">
        {showToc && <Toc entries={tocEntries} />}
      </div>
    </div>
  );
};
