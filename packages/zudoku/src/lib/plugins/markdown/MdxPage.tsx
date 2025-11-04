import { useMDXComponents } from "@mdx-js/react";
import slugify from "@sindresorhus/slugify";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "zudoku/ui/DropdownMenu.js";
import { CategoryHeading } from "../../components/CategoryHeading.js";
import { Heading } from "../../components/Heading.js";
import { Toc } from "../../components/navigation/Toc.js";
import {
  useCurrentItem,
  usePrevNext,
} from "../../components/navigation/utils.js";
import { Pagination } from "../../components/Pagination.js";
import { Typography } from "../../components/Typography.js";
import { joinUrl } from "../../util/joinUrl.js";
import type { MdxComponentsType } from "../../util/MdxComponents.js";
import { ChatGPTLogo } from "./assets/ChatGPTLogo.js";
import { ClaudeLogo } from "./assets/ClaudeLogo.js";
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
  const [isCopied, setIsCopied] = useState(false);

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

  const copyMarkdownConfig =
    frontmatter.copyPage !== false && defaultOptions?.copyPage !== false;

  const markdownUrl = joinUrl(basePath, `${location.pathname}.md`);

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
      </Helmet>
      <Typography className="max-w-full xl:w-full xl:max-w-3xl flex-1 shrink pt-(--padding-content-top)">
        {(category || title) && (
          <header className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {category && <CategoryHeading>{category}</CategoryHeading>}
              {title && (
                <Heading level={1} id={slugify(title)}>
                  {title}
                </Heading>
              )}
            </div>
            {copyMarkdownConfig && (
              <div className="flex items-center border rounded-md">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyMarkdown}
                  className="rounded-r-none border-r gap-2 h-7"
                >
                  {isCopied ? (
                    <CheckIcon size={14} className="text-emerald-600" />
                  ) : (
                    <CopyIcon size={14} />
                  )}
                  <span>Copy page</span>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="rounded-l-none"
                    >
                      <ChevronDownIcon size={14} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="gap-2"
                      onClick={() =>
                        void navigator.clipboard.writeText(window.location.href)
                      }
                    >
                      <Link2Icon className="size-4" />
                      Copy link to page
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2" asChild>
                      <a
                        href={markdownUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLinkIcon className="size-4" />
                        Open Markdown page
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2"
                      onClick={() => {
                        const prompt = encodeURIComponent(
                          `Help me understand this documentation page: ${window.location.href}`,
                        );
                        window.open(
                          `https://claude.ai/new?q=${prompt}`,
                          "_blank",
                        );
                      }}
                    >
                      <ClaudeLogo className="size-4" />
                      Open in Claude
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2"
                      onClick={() => {
                        const prompt = encodeURIComponent(
                          `Help me understand this documentation page: ${window.location.href}`,
                        );
                        window.open(
                          `https://chatgpt.com/?q=${prompt}`,
                          "_blank",
                        );
                      }}
                    >
                      <ChatGPTLogo className="size-4" />
                      Open in ChatGPT
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
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
