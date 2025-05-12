import { useMDXComponents } from "@mdx-js/react";
import slugify from "@sindresorhus/slugify";
import { Helmet } from "@zudoku/react-helmet-async";
import { type PropsWithChildren, useEffect } from "react";
import { CategoryHeading } from "../../components/CategoryHeading.js";
import { Heading } from "../../components/Heading.js";
import { ProseClasses } from "../../components/Markdown.js";
import { Pagination } from "../../components/Pagination.js";
import { Toc } from "../../components/navigation/Toc.js";
import {
  useCurrentItem,
  usePrevNext,
} from "../../components/navigation/utils.js";
import type { MdxComponentsType } from "../../util/MdxComponents.js";
import { cn } from "../../util/cn.js";
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
      </Helmet>
      <div
        className={cn(
          ProseClasses,
          "max-w-full xl:w-full xl:max-w-3xl flex-1 flex-shrink pt-[--padding-content-top]",
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
            <hr className="my-10" />
            <Pagination
              prev={prev ? { to: prev.id, label: prev.label } : undefined}
              next={next ? { to: next.id, label: next.label } : undefined}
              className="mb-4"
            />
          </>
        )}
      </div>
      <div className="hidden xl:block">
        {showToc && <Toc entries={tocEntries} />}
      </div>
    </div>
  );
};
