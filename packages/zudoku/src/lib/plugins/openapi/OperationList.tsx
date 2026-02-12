import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Helmet } from "@zudoku/react-helmet-async";
import { ChevronsDownUpIcon, ChevronsUpDownIcon } from "lucide-react";
import { useNavigate, useParams } from "react-router";
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
import { CategoryHeading } from "../../components/CategoryHeading.js";
import { useApiIdentities } from "../../components/context/ZudokuContext.js";
import { Heading } from "../../components/Heading.js";
import { Markdown } from "../../components/Markdown.js";
import { PagefindSearchMeta } from "../../components/PagefindSearchMeta.js";
import { Pagination } from "../../components/Pagination.js";
import { useCreateQuery } from "./client/useCreateQuery.js";
import { useOasConfig } from "./context.js";
import { DownloadSchemaButton } from "./DownloadSchemaButton.js";
import { Endpoint } from "./Endpoint.js";
import { graphql } from "./graphql/index.js";
import { UNTAGGED_PATH } from "./index.js";
import { OperationListItem } from "./OperationListItem.js";
import { useSelectedServer } from "./state.js";
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
    extensions
    servers {
      url
      description
    }
    parameters {
      name
      in
      description
      required
      schema
      style
      explode
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

const SchemaWarmupQuery = graphql(/* GraphQL */ `
  query SchemaWarmup($input: JSON!, $type: SchemaType!) {
    schema(input: $input, type: $type) {
      openapi
    }
  }
`);

const OperationsForTagQuery = graphql(/* GraphQL */ `
  query OperationsForTag(
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
      tag(slug: $tag, untagged: $untagged) {
        name
        description
        operations {
          slug
          ...OperationsFragment
        }
        extensions
        next {
          name
          slug
          extensions
        }
        prev {
          name
          slug
          extensions
        }
      }
    }
  }
`);

const LAZY_OPERATION_LIST_THRESHOLD = 30;

export const OperationList = ({
  tag,
  untagged,
}: {
  tag?: string;
  untagged?: boolean;
}) => {
  const { input, type, versions, version, options } = useOasConfig();
  const { tag: tagFromParams } = useParams<"tag">();
  const query = useCreateQuery(OperationsForTagQuery, {
    input,
    type,
    tag: tag ?? tagFromParams,
    untagged,
  });
  const result = useSuspenseQuery(query);
  const {
    data: { schema },
  } = result;
  // Global server selection for the dropdown UI
  const { selectedServer: globalSelectedServer } = useSelectedServer(
    schema.servers,
  );
  const title = schema.title;
  const summary = schema.summary;
  const description = schema.description;
  const navigate = useNavigate();

  // This is to warmup (i.e. load the schema in the background) the schema on the client, if the page has been rendered on the server
  const warmupQuery = useCreateQuery(SchemaWarmupQuery, { input, type });
  useQuery({
    ...warmupQuery,
    enabled: typeof window !== "undefined",
    notifyOnChangeProps: [],
  });

  // Prefetch for Playground
  useApiIdentities();

  if (!schema.tag) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center">
        <div className="text-muted-foreground font-medium">
          No operations found
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          This API doesn't have any operations defined yet.
        </div>
      </div>
    );
  }

  const { operations, next, prev, description: tagDescription } = schema.tag;

  // Simple heuristic to determine if we should lazy highlight the code
  // This is to avoid the performance issues when there are a lot of operations
  const shouldLazyHighlight = operations.length > LAZY_OPERATION_LIST_THRESHOLD;

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

  const hasMultipleVersions = Object.entries(versions).length > 1;

  const showVersions =
    options?.showVersionSelect === "always" ||
    (hasMultipleVersions && options?.showVersionSelect !== "hide");

  const paginationProps = {
    prev: prev
      ? {
          to: `../${prev.slug}`,
          label: prev.extensions?.["x-displayName"] ?? prev.name,
        }
      : undefined,
    next: next
      ? {
          to: `../${next.slug ?? UNTAGGED_PATH}`,
          label:
            next.extensions?.["x-displayName"] ??
            next.name ??
            "Other endpoints",
        }
      : undefined,
  };

  const tagTitle = schema.tag.extensions?.["x-displayName"] ?? schema.tag.name;
  const helmetTitle = [tagTitle, title].filter(Boolean).join(" - ");

  const currentVersion = version != null ? versions[version] : undefined;
  const downloadUrl =
    typeof input === "string"
      ? type === "url"
        ? input
        : currentVersion?.downloadUrl
      : undefined;

  return (
    <div
      className="pt-(--padding-content-top)"
      data-pagefind-filter="section:openapi"
      data-pagefind-meta="section:openapi"
    >
      <PagefindSearchMeta name="category">{title}</PagefindSearchMeta>
      <Helmet>
        {helmetTitle && <title>{helmetTitle}</title>}
        {metaDescription && (
          <meta name="description" content={metaDescription} />
        )}
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
                {showVersions && (
                  <span className="text-xl text-muted-foreground ms-1.5">
                    {" "}
                    ({schema.version})
                  </span>
                )}
              </Heading>
              <Endpoint />
            </div>
            <div className="flex flex-col gap-4 sm:items-end">
              <div className="flex gap-2 items-center">
                {showVersions && (
                  <Select
                    onValueChange={(version) =>
                      // biome-ignore lint/style/noNonNullAssertion: is guaranteed to be defined
                      navigate(versions[version]!.path)
                    }
                    defaultValue={version}
                    disabled={!hasMultipleVersions}
                  >
                    <SelectTrigger className="w-[180px]" size="sm">
                      <SelectValue placeholder="Select version" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(versions).map(([version, { label }]) => (
                        <SelectItem key={version} value={version}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {options?.schemaDownload?.enabled && downloadUrl && (
                  <DownloadSchemaButton downloadUrl={downloadUrl} />
                )}
              </div>
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
      {/* px, -mx is so that `content-visibility` doesn't cut off overflown heading anchor links '#' */}
      <div className="px-6 mt-6 -mx-6 [content-visibility:auto]">
        {operations.map((fragment) => (
          <div key={fragment.slug}>
            <OperationListItem
              operationFragment={fragment}
              globalSelectedServer={globalSelectedServer}
              shouldLazyHighlight={shouldLazyHighlight}
            />
            <hr className="my-10" />
          </div>
        ))}
        <Pagination className="mb-4" {...paginationProps} />
      </div>
    </div>
  );
};
