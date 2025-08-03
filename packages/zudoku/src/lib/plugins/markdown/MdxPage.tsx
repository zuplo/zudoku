import { useMDXComponents } from "@mdx-js/react";
import slugify from "@sindresorhus/slugify";
import { Helmet } from "@zudoku/react-helmet-async";
import { EditIcon } from "lucide-react";
import { type PropsWithChildren, useEffect } from "react";
import { Button } from "zudoku/ui/Button.js";
import { CategoryHeading } from "../../components/CategoryHeading.js";
import { Heading } from "../../components/Heading.js";
import { Toc } from "../../components/navigation/Toc.js";
import {
  useCurrentItem,
  usePrevNext,
} from "../../components/navigation/utils.js";
import { Pagination } from "../../components/Pagination.js";
import { Typography } from "../../components/Typography.js";
import type { MdxComponentsType } from "../../util/MdxComponents.js";
import type { MarkdownPluginDefaultOptions, MDXImport } from "./index.js";

declare global {
  interface Window {
    __getReactRefreshIgnoredExports?: (args: {
      id: string;
    }) => string[] | undefined;
  }
}

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

export const MdxPage = ({
  mdxComponent: MdxComponent,
  frontmatter = {},
  defaultOptions,
  __filepath,
  tableOfContents,
  excerpt,
}: PropsWithChildren<
  Omit<MDXImport, "default"> & {
    mdxComponent: MDXImport["default"];
    defaultOptions?: MarkdownPluginDefaultOptions;
  }
>) => {
  const categoryTitle = useCurrentItem()?.categoryLabel;

  const title = frontmatter.title;
  const description = frontmatter.description ?? excerpt;
  const category = frontmatter.category ?? categoryTitle;
  const hideToc = frontmatter.toc === false || defaultOptions?.toc === false;
  const pageTitle =
    title ?? tableOfContents.find((item) => item.depth === 1)?.value;
  const hidePager =
    frontmatter.disable_pager ??
    frontmatter.disablePager ??
    defaultOptions?.disablePager ??
    false;

  const showLastModified =
    frontmatter.showLastModified ?? defaultOptions?.showLastModified ?? true;

  const lastModifiedDate = frontmatter.lastModifiedTime
    ? new Date(frontmatter.lastModifiedTime)
    : null;

  const editConfig =
    frontmatter.suggestEdit !== false &&
    (frontmatter.suggestEdit ?? defaultOptions?.suggestEdit);

  const editUrl = editConfig
    ? editConfig.url.replaceAll("{filePath}", __filepath)
    : null;
  const editText = editConfig ? editConfig.text || "Edit this page" : null;

  const tocEntries =
    tableOfContents.find((item) => item.depth === 1)?.children ??
    // if `title` is provided by frontmatter it does not appear in the table of contents
    tableOfContents.filter((item) => item.depth === 2);

  const showToc = !hideToc && tocEntries.length > 0;

  const { prev, next } = usePrevNext();

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
      className="grid grid-cols-1 xl:grid-cols-(--sidecar-grid-cols) gap-8 justify-between"
      data-pagefind-filter="section:markdown"
      data-pagefind-meta="section:markdown"
    >
      <Helmet>
        <title>{pageTitle}</title>
        {description && <meta name="description" content={description} />}
      </Helmet>
      <Typography className="max-w-full xl:w-full xl:max-w-3xl flex-1 shrink pt-(--padding-content-top)">
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
        <div className="h-16" />
        {(showLastModified && lastModifiedDate) || editUrl ? (
          <div className="flex justify-between text-xs text-muted-foreground ">
            <div />
            <div className="flex items-center gap-2">
              <div>
                {editUrl && (
                  <Button asChild variant="ghost" size="sm">
                    <a
                      href={editUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1"
                    >
                      <EditIcon size={12} />
                      {editText}
                    </a>
                  </Button>
                )}
              </div>
              <div>
                {showLastModified && lastModifiedDate && (
                  <div
                    title={lastModifiedDate.toLocaleString(undefined, {
                      dateStyle: "full",
                      timeStyle: "medium",
                    })}
                  >
                    Last modified on{" "}
                    <time dateTime={lastModifiedDate.toISOString()}>
                      {lastModifiedDate.toLocaleDateString("en-US", {
                        dateStyle: "long",
                      })}
                    </time>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
        {!hidePager && (
          <>
            <div className="h-px bg-border mt-2 mb-6" />
            <Pagination
              prev={prev ? { to: prev.id, label: prev.label ?? "" } : undefined}
              next={next ? { to: next.id, label: next.label ?? "" } : undefined}
              className="mb-10"
            />
          </>
        )}
      </Typography>
      <div className="hidden xl:block" data-pagefind-ignore="all">
        {showToc && <Toc entries={tocEntries} />}
      </div>
    </div>
  );
};
