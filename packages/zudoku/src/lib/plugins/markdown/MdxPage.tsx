import { useMDXComponents } from "@mdx-js/react";
import slugify from "@sindresorhus/slugify";
import { Helmet } from "@zudoku/react-helmet-async";
import { type PropsWithChildren } from "react";
import { Link } from "react-router-dom";
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
import { MarkdownPluginDefaultOptions, MDXImport } from "./index.js";

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
  frontmatter = {},
  defaultOptions,
  tableOfContents,
}: PropsWithChildren<
  Omit<MDXImport, "default"> & {
    mdxComponent: MDXImport["default"];
    defaultOptions?: MarkdownPluginDefaultOptions;
  }
>) => {
  const categoryTitle = useCurrentItem()?.categoryLabel;
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

  return (
    <div className="xl:grid grid-cols-[--sidecar-grid-cols] gap-8 justify-between">
      <Helmet>
        <title>{pageTitle}</title>
      </Helmet>
      <div
        className={cn(
          ProseClasses,
          "max-w-full xl:w-full xl:max-w-prose flex-1 flex-shrink pt-[--padding-content-top] pb-[--padding-content-bottom]",
        )}
      >
        <header>
          {category && <CategoryHeading>{category}</CategoryHeading>}
          {title && (
            <Heading level={1} id={slugify(title)}>
              {title}
            </Heading>
          )}
        </header>
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
