import { type ResultOf } from "@graphql-typed-document-node/core";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Helmet } from "@zudoku/react-helmet-async";
import { ChevronsDownUpIcon, ChevronsUpDownIcon } from "lucide-react";
import { useNavigate } from "react-router";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "zudoku/ui/Collapsible.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "zudoku/ui/Select.js";
import { useSelectedServer } from "../../authentication/state.js";
import { CategoryHeading } from "../../components/CategoryHeading.js";
import { Heading } from "../../components/Heading.js";
import { Markdown, ProseClasses } from "../../components/Markdown.js";
import { useApiIdentities } from "../../components/context/ZudokuContext.js";
import { cn } from "../../util/cn.js";
import { Endpoint } from "./Endpoint.js";
import { OperationListItem } from "./OperationListItem.js";
import { useCreateQuery } from "./client/useCreateQuery.js";
import { useOasConfig } from "./context.js";
import { graphql } from "./graphql/index.js";
import { sanitizeMarkdownForMetatag } from "./util/sanitizeMarkdownForMetatag.js";

export const OperationsFragment = graphql(/* GraphQL */ `
  fragment OperationsFragment on OperationItem {
    slug
    summary
    method
    description
    operationId
    contentTypes
    path
    deprecated
    parameters {
      name
      in
      description
      required
      schema
      style
      examples {
        name
        description
        externalValue
        value
        summary
      }
    }
    requestBody {
      content {
        mediaType
        encoding {
          name
        }
        examples {
          name
          description
          externalValue
          value
          summary
        }
        schema
      }
      description
      required
    }
    responses {
      statusCode
      links
      description
      content {
        examples {
          name
          description
          externalValue
          value
          summary
        }
        mediaType
        encoding {
          name
        }
        schema
      }
    }
  }
`);

export type OperationListItemResult = ResultOf<typeof OperationsFragment>;

const AllOperationsQuery = graphql(/* GraphQL */ `
  query AllOperations(
    $input: JSON!
    $type: SchemaType!
    $tag: String
    $untagged: Boolean
  ) {
    schema(input: $input, type: $type) {
      servers {
        url
      }
      description
      summary
      title
      url
      version
      tags(name: $tag) {
        name
        description
      }
      operations(tag: $tag, untagged: $untagged) {
        slug
        ...OperationsFragment
      }
    }
  }
`);

export const OperationList = ({
  tag,
  untagged,
}: {
  tag?: string;
  untagged?: boolean;
}) => {
  const { input, type, versions, version } = useOasConfig();
  const query = useCreateQuery(AllOperationsQuery, {
    input,
    type,
    tag,
    untagged,
  });
  const result = useSuspenseQuery(query);
  const {
    data: { schema },
  } = result;
  const { selectedServer } = useSelectedServer(schema.servers);
  const title = schema.title;
  const summary = schema.summary;
  const description = schema.description;
  const navigate = useNavigate();
  const operations = schema.operations;
  const tagDescription = schema.tags.find((t) => t.name === tag)?.description;

  // Prefetch for Playground
  useApiIdentities();

  // The summary property is preferable here as it is a short description of
  // the API, whereas the description property is typically longer and supports
  // commonmark formatting, making it ill-suited for use in the meta description
  const metaDescription = tagDescription
    ? sanitizeMarkdownForMetatag(tagDescription)
    : summary
      ? summary
      : description
        ? sanitizeMarkdownForMetatag(description)
        : undefined;

  const showVersions = Object.entries(versions).length > 1;

  return (
    <div
      className="pt-[--padding-content-top]"
      data-pagefind-filter="section:openapi"
      data-pagefind-meta="section:openapi"
    >
      <Helmet>
        <title>{[tag, title].filter(Boolean).join(" - ")}</title>
        {metaDescription && (
          <meta name="description" content={metaDescription} />
        )}
      </Helmet>
      <div className="mb-8">
        <Collapsible className="w-full">
          <div className="flex flex-col gap-y-4 sm:flex-row justify-around items-start sm:items-end">
            <div className="flex-1">
              <CategoryHeading>{title}</CategoryHeading>
              <Heading
                level={1}
                id="description"
                registerSidebarAnchor
                className="mb-0"
              >
                {tag}
                {showVersions && (
                  <span className="text-xl text-muted-foreground ml-1.5">
                    {" "}
                    ({version})
                  </span>
                )}
              </Heading>
            </div>
            <div className="flex flex-col gap-4 sm:items-end">
              {showVersions && (
                <Select
                  onValueChange={(version) => navigate(versions[version]!)}
                  defaultValue={version}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select version" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(versions).map(([version]) => (
                      <SelectItem key={version} value={version}>
                        {version}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {schema.description && (
                <CollapsibleTrigger className="flex items-center gap-1 text-sm font-medium text-muted-foreground group">
                  <span>Schema description</span>

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
              <div
                className={cn(
                  ProseClasses,
                  "pt-4 max-w-full prose-img:max-w-prose",
                )}
              >
                <Markdown
                  className="border rounded bg-muted/25 border-border px-2.5 md:px-4"
                  content={schema.description}
                />
              </div>
            </CollapsibleContent>
          )}
        </Collapsible>
        {tagDescription && (
          <p
            className={cn(
              ProseClasses,
              "my-4 max-w-full prose-img:max-w-prose",
            )}
          >
            <Markdown content={tagDescription} />
          </p>
        )}
      </div>
      <hr />
      <div className="my-4 flex items-center justify-end gap-4">
        <Endpoint />
      </div>
      {operations.map((fragment) => (
        <OperationListItem
          serverUrl={selectedServer}
          key={fragment.slug}
          operationFragment={fragment}
        />
      ))}
      {/* {schema.tags
        .filter((tag) => tag.operations.length > 0)
        .map((tag) => (
          // px, -mx is so that `content-visibility` doesn't cut off overflown heading anchor links '#'
          <div key={tag.name} className="px-6 -mx-6 [content-visibility:auto]">
            {tag.name && <CategoryHeading>{tag.name}</CategoryHeading>}
            {tag.description && (
              <Markdown
                className={`${ProseClasses} max-w-full prose-img:max-w-prose w-full mt-2 mb-12`}
                content={tag.description}
              />
            )}
            <div className="operation mb-12">
              <StaggeredRender>
                {tag.operations.map((fragment) => (
                  <OperationListItem
                    serverUrl={selectedServer ?? schema.url}
                    key={fragment.slug}
                    operationFragment={fragment}
                  />
                ))}
              </StaggeredRender>
            </div>
          </div>
        ))} */}
    </div>
  );
};
