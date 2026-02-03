import { useSuspenseQuery } from "@tanstack/react-query";
import { Helmet } from "@zudoku/react-helmet-async";
import { ChevronsDownUpIcon, ChevronsUpDownIcon } from "lucide-react";
import { useParams } from "react-router";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "zudoku/ui/Collapsible.js";
import type { EnrichedOperation } from "../../asyncapi/parser/operations.js";
import { CategoryHeading } from "../../components/CategoryHeading.js";
import { Heading } from "../../components/Heading.js";
import { Markdown } from "../../components/Markdown.js";
import { Pagination } from "../../components/Pagination.js";
import { useCreateQuery } from "./client/useCreateQuery.js";
import { useAsyncApiConfig } from "./context.js";
import {
  type OperationResult,
  OperationsForTagQuery,
} from "./graphql/queries.js";
import { OperationListItem } from "./OperationListItem.js";

export const UNTAGGED_PATH = "~endpoints";

/**
 * Convert GraphQL operation result to EnrichedOperation format
 */
const toEnrichedOperation = (op: OperationResult): EnrichedOperation => ({
  action: op.action,
  operationId: op.operationId,
  channelAddress: op.channelAddress ?? undefined,
  channelId: "",
  protocols: op.protocols,
  parentTag: undefined,
  summary: op.summary ?? undefined,
  description: op.description ?? undefined,
  messages: op.messages.map((m) => ({
    name: m.name ?? undefined,
    title: m.title ?? undefined,
    summary: m.summary ?? undefined,
    description: m.description ?? undefined,
    contentType: m.contentType ?? undefined,
    payload: m.payload ?? undefined,
    headers: m.headers ?? undefined,
  })),
});

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

  const {
    operations,
    next,
    prev,
    description: tagDescription,
    name: tagName,
  } = schema.tag;

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
                <span className="text-xl text-muted-foreground ms-1.5">
                  {" "}
                  ({schema.version})
                </span>
              </Heading>
              {serverUrl && (
                <div className="text-sm font-mono text-muted-foreground">
                  {serverUrl}
                </div>
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
        {tagDescription && (
          <Markdown
            className="my-4 max-w-full prose-img:max-w-prose"
            content={tagDescription}
          />
        )}
      </div>
      <hr />
      <div className="px-6 mt-6 -mx-6 [content-visibility:auto]">
        {operations.map((operation) => (
          <div key={operation.operationId}>
            <OperationListItem
              operation={toEnrichedOperation(operation)}
              serverUrl={serverUrl}
            />
            <hr className="my-10" />
          </div>
        ))}
        <Pagination className="mb-4" {...paginationProps} />
      </div>
    </div>
  );
};
