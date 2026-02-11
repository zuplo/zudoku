import { useSuspenseQuery } from "@tanstack/react-query";
import { Helmet } from "@zudoku/react-helmet-async";
import {
  CheckIcon,
  ChevronsDownUpIcon,
  ChevronsUpDownIcon,
  CopyIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useParams } from "react-router";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "zudoku/ui/Collapsible.js";
import { CategoryHeading } from "../../components/CategoryHeading.js";
import { Heading } from "../../components/Heading.js";
import { InlineCode } from "../../components/InlineCode.js";
import { Markdown } from "../../components/Markdown.js";
import { Pagination } from "../../components/Pagination.js";
import { Button } from "../../ui/Button.js";
import { ChannelGroup, groupOperationsByChannel } from "./ChannelGroup.js";
import { useCreateQuery } from "./client/useCreateQuery.js";
import { useAsyncApiConfig } from "./context.js";
import { OperationsForTagQuery } from "./graphql/queries.js";

const CopyButton = ({ url }: { url: string }) => {
  const [isCopied, setIsCopied] = useState(false);

  return (
    <Button
      onClick={() => {
        void navigator.clipboard.writeText(url).then(() => {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
        });
      }}
      variant="ghost"
      size="icon-xs"
    >
      {isCopied ? (
        <CheckIcon className="text-green-600" size={14} />
      ) : (
        <CopyIcon size={14} strokeWidth={1.3} />
      )}
    </Button>
  );
};

export const UNTAGGED_PATH = "~endpoints";

export const OperationList = ({
  tag,
  untagged,
}: {
  tag?: string;
  untagged?: boolean;
}) => {
  const { options } = useAsyncApiConfig();
  const { tag: tagFromParams } = useParams<"tag">();

  const query = useCreateQuery(OperationsForTagQuery, {
    tag: untagged ? null : (tag ?? tagFromParams ?? null),
  });

  const { data } = useSuspenseQuery(query);
  const { schema } = data;

  const operations = schema.tag?.operations ?? [];
  const next = schema.tag?.next;
  const prev = schema.tag?.prev;
  const tagDescription = schema.tag?.description;
  const tagName = schema.tag?.name;

  // Group operations by channel address
  const channelGroups = useMemo(
    () => groupOperationsByChannel(operations),
    [operations],
  );

  const title = schema.title;
  const tagTitle = tagName ?? "Endpoints";
  const helmetTitle = [tagTitle, title].filter(Boolean).join(" - ");

  const paginationProps = {
    prev: prev?.slug
      ? {
          to: `../${prev.slug}`,
          label: prev.name ?? "Previous",
        }
      : undefined,
    next: next?.slug
      ? {
          to: `../${next.slug ?? UNTAGGED_PATH}`,
          label: next.name ?? "Other endpoints",
        }
      : undefined,
  };

  // Get first server URL for display
  const serverUrl = schema.servers[0]
    ? `${schema.servers[0].protocol}://${schema.servers[0].host}${schema.servers[0].pathname ?? ""}`
    : undefined;

  if (!schema.tag) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center">
        <div className="text-muted-foreground font-medium">
          No operations found
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          This API doesn&apos;t have any operations defined yet.
        </div>
      </div>
    );
  }

  return (
    <div
      className="pt-(--padding-content-top)"
      data-pagefind-filter="section:asyncapi"
      data-pagefind-meta="section:asyncapi"
    >
      <Helmet>
        {helmetTitle && <title>{helmetTitle}</title>}
        {tagDescription && <meta name="description" content={tagDescription} />}
      </Helmet>

      <div className="mb-8">
        <Collapsible
          className="w-full"
          defaultOpen={options?.expandApiInformation}
        >
          <div className="flex flex-col gap-4 sm:flex-row justify-around items-start sm:items-end">
            <div className="flex flex-col flex-1 gap-2">
              <CategoryHeading>{title}</CategoryHeading>
              <Heading
                level={1}
                id="description"
                registerNavigationAnchor
                className="mb-0"
              >
                {tagTitle}
                {schema.version && (
                  <span className="text-xl text-muted-foreground ms-1.5">
                    {" "}
                    ({schema.version})
                  </span>
                )}
              </Heading>
              {serverUrl && (
                <div className="flex items-center gap-1.5 flex-nowrap">
                  <span className="font-medium text-sm">Endpoint</span>
                  <InlineCode className="text-xs px-2 py-1.5" selectOnClick>
                    {serverUrl}
                  </InlineCode>
                  <CopyButton url={serverUrl} />
                </div>
              )}
              {tagDescription && (
                <p className="text-muted-foreground">{tagDescription}</p>
              )}
            </div>
            <div className="flex flex-col gap-4 sm:items-end">
              {schema.description && (
                <CollapsibleTrigger className="flex items-center gap-1 text-sm font-medium text-muted-foreground group">
                  <span>API information</span>
                  <ChevronsUpDownIcon
                    className="group-data-[state=open]:hidden translate-y-px"
                    size={14}
                  />
                  <ChevronsDownUpIcon
                    className="group-data-[state=closed]:hidden translate-y-px"
                    size={13}
                  />
                </CollapsibleTrigger>
              )}
            </div>
          </div>
          {schema.description && (
            <CollapsibleContent className="CollapsibleContent">
              <div className="mt-4 max-w-full border rounded-sm bg-muted/25">
                <Markdown
                  className="max-w-full prose-img:max-w-prose border-border p-3 lg:p-5"
                  content={schema.description}
                />
              </div>
            </CollapsibleContent>
          )}
        </Collapsible>
      </div>
      <hr />
      {/* px, -mx is so that `content-visibility` doesn't cut off overflown heading anchor links '#' */}
      <div className="px-6 mt-6 -mx-6 [content-visibility:auto]">
        {Array.from(channelGroups.entries()).map(
          ([channelAddress, channelOps]) => (
            <div key={channelAddress}>
              <ChannelGroup
                channelAddress={channelAddress}
                operations={channelOps}
              />
              <hr className="my-10" />
            </div>
          ),
        )}
        <Pagination className="mb-4" {...paginationProps} />
      </div>
    </div>
  );
};
