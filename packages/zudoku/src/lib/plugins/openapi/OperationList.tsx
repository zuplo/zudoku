import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Helmet } from "@zudoku/react-helmet-async";
import { Navigate, useParams } from "react-router";
import { useApiIdentities } from "../../components/context/ZudokuContext.js";
import { Markdown } from "../../components/Markdown.js";
import { usePrevNext } from "../../components/navigation/utils.js";
import { PagefindSearchMeta } from "../../components/PagefindSearchMeta.js";
import { Pagination } from "../../components/Pagination.js";
import { ApiHeader } from "./ApiHeader.js";
import { useCreateQuery } from "./client/useCreateQuery.js";
import { useOasConfig } from "./context.js";
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
      allowReserved
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
  const { input, type } = useOasConfig();
  const { tag: tagFromParams } = useParams<"tag">();
  const query = useCreateQuery(OperationsForTagQuery, {
    input,
    type,
    tag: tag ?? tagFromParams,
    untagged,
  });
  const schema = useSuspenseQuery(query).data.schema;
  const { selectedServer: globalSelectedServer } = useSelectedServer(
    schema.servers,
  );
  const title = schema.title;
  const summary = schema.summary;
  const description = schema.description;
  const { prev: navPrev, next: navNext } = usePrevNext();

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
    // Route targets a tag or untagged ops that don't exist in this version
    if (tag || tagFromParams || untagged) {
      return <Navigate to=".." replace />;
    }

    return (
      <div
        className="flex flex-col h-full items-center justify-center text-center"
        data-pagefind-ignore="all"
      >
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

  const paginationProps = {
    prev: prev
      ? {
          to: `../${prev.slug}`,
          label: prev.extensions?.["x-displayName"] ?? prev.name,
        }
      : navPrev
        ? { to: navPrev.id, label: navPrev.label }
        : undefined,
    next: next
      ? {
          to: `../${next.slug ?? UNTAGGED_PATH}`,
          label:
            next.extensions?.["x-displayName"] ??
            next.name ??
            "Other endpoints",
        }
      : navNext
        ? { to: navNext.id, label: navNext.label }
        : undefined,
  };

  const tagTitle = untagged
    ? "Other endpoints"
    : (schema.tag.extensions?.["x-displayName"] ?? schema.tag.name);

  const helmetTitle = [tagTitle, title].filter(Boolean).join(" - ");

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
        <ApiHeader
          title={title}
          heading={tagTitle}
          headingId="description"
          description={description ?? undefined}
          tag={tag ?? tagFromParams}
        >
          <Endpoint />
        </ApiHeader>
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
