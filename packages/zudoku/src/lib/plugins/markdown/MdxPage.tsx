import { useMDXComponents } from "@mdx-js/react";
import { Helmet } from "@zudoku/react-helmet-async";
import {
  CheckIcon,
  ChevronDownIcon,
  CopyIcon,
  EditIcon,
  ExternalLinkIcon,
  Link2Icon,
} from "lucide-react";
import { type PropsWithChildren, useEffect, useState } from "react";
import { useLocation } from "react-router";
import { Button } from "zudoku/ui/Button.js";
import { ButtonGroup } from "zudoku/ui/ButtonGroup.js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "zudoku/ui/DropdownMenu.js";
import { AiAssistantMenuItems } from "../../components/AiAssistantMenuItems.js";
import { CategoryHeading } from "../../components/CategoryHeading.js";
import { useZudoku } from "../../components/context/ZudokuContext.js";
import { DeveloperHint } from "../../components/DeveloperHint.js";
import { Heading } from "../../components/Heading.js";
import { Toc } from "../../components/navigation/Toc.js";
import {
  useCurrentItem,
  usePrevNext,
} from "../../components/navigation/utils.js";
import { Pagination } from "../../components/Pagination.js";
import { Typography } from "../../components/Typography.js";
import { joinUrl } from "../../util/joinUrl.js";
import { getMarkdownPathname } from "../../util/markdown.js";
import type { MdxComponentsType } from "../../util/MdxComponents.js";
import { slugify } from "../../util/slugify.js";
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
  basePath,
  frontmatter = {},
  defaultOptions,
  __filepath,
  tableOfContents,
  excerpt,
}: PropsWithChildren<
  Omit<MDXImport, "default"> & {
    basePath: string;
    mdxComponent: MDXImport["default"];
    defaultOptions?: MarkdownPluginDefaultOptions;
  }
>) => {
  const categoryTitle = useCurrentItem()?.categoryLabel;
  const location = useLocation();
  const { options } = useZudoku();
  const [isCopied, setIsCopied] = useState(false);

  const title = frontmatter.title;
  const description = frontmatter.description ?? excerpt;
  const category = frontmatter.category ?? categoryTitle;
  const hideToc = frontmatter.toc === false || defaultOptions?.toc === false;
  const pageTitle =
    title ?? tableOfContents.find((item) => item.depth === 1)?.text;
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

  const copyMarkdownConfig =
    frontmatter.copyPage !== false && defaultOptions?.copyPage !== false;

  const markdownUrl = joinUrl(
    basePath,
    `${getMarkdownPathname(location.pathname)}.md`,
  );

  const handleCopyMarkdown = async () => {
    const response = await fetch(markdownUrl);
    if (!response.ok) throw new Error("Failed to fetch markdown");
    const markdown = await response.text();
    void navigator.clipboard.writeText(markdown);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

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
        <link rel="alternate" type="text/markdown" href={markdownUrl} />
      </Helmet>

      <Typography className="max-w-full xl:w-full xl:max-w-3xl flex-1 shrink pt-(--padding-content-top)">
        <header className="flow-root">
          {copyMarkdownConfig && (
            <div
              className="float-end ms-4 mt-1"
              role="group"
              aria-label="Page actions"
            >
              <ButtonGroup>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyMarkdown}
                >
                  {isCopied ? (
                    <CheckIcon
                      size={14}
                      className="text-emerald-600"
                      aria-hidden="true"
                    />
                  ) : (
                    <CopyIcon size={14} aria-hidden="true" />
                  )}
                  <span>Copy page</span>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      aria-label="More actions"
                    >
                      <ChevronDownIcon size={14} aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="gap-2"
                      onClick={() =>
                        void navigator.clipboard.writeText(window.location.href)
                      }
                    >
                      <Link2Icon className="size-4" aria-hidden="true" />
                      Copy link to page
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2" asChild>
                      <a
                        href={markdownUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLinkIcon
                          className="size-4"
                          aria-hidden="true"
                        />
                        Open Markdown page
                      </a>
                    </DropdownMenuItem>
                    <AiAssistantMenuItems
                      aiAssistants={options.aiAssistants}
                      getPageUrl={() => window.location.href}
                      type="docs"
                    />
                  </DropdownMenuContent>
                </DropdownMenu>
              </ButtonGroup>
            </div>
          )}
          {category && <CategoryHeading>{category}</CategoryHeading>}
          {title && (
            <Heading level={1} id={slugify(title)}>
              {title}
            </Heading>
          )}
        </header>

        {frontmatter.draft && (
          <DeveloperHint>
            This page is a draft and is not visible in production.
          </DeveloperHint>
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
                      <EditIcon size={12} aria-hidden="true" />
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
