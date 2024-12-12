import { ResultOf } from "@graphql-typed-document-node/core";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Helmet } from "@zudoku/react-helmet-async";
import { CategoryHeading } from "../../components/CategoryHeading.js";
import { Heading } from "../../components/Heading.js";
import { Markdown, ProseClasses } from "../../components/Markdown.js";
import { cn } from "../../util/cn.js";
import { Endpoint } from "./Endpoint.js";
import { OperationListItem } from "./OperationListItem.js";
import StaggeredRender from "./StaggeredRender.js";
import { useCreateQuery } from "./client/useCreateQuery.js";
import { useOasConfig } from "./context.js";
import { graphql } from "./graphql/index.js";

export const OperationsFragment = graphql(/* GraphQL */ `
  fragment OperationsFragment on OperationItem {
    slug
    summary
    method
    description
    operationId
    contentTypes
    path
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
  query AllOperations($input: JSON!, $type: SchemaType!) {
    schema(input: $input, type: $type) {
      description
      summary
      title
      url
      version
      tags {
        name
        description
        operations {
          slug
          ...OperationsFragment
        }
      }
    }
  }
`);

/**
 * @description Clean up a commonmark formatted description for use in the meta
 * description.
 */
function cleanDescription(
  description: string,
  maxLength: number = 160,
): string {
  if (!description) {
    return "";
  }

  // Replace Markdown links [text](url) with just "text"
  description = description.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // Remove Markdown image syntax: ![alt](url)
  description = description.replace(/!\[.*?\]\(.*?\)/g, "");

  // Remove other Markdown syntax (e.g., **bold**, _italic_, `code`)
  description = description.replace(/[_*`~]/g, "");

  // Remove headings (# Heading), blockquotes (> Quote), and horizontal rules (--- or ***)
  description = description.replace(/^(?:>|\s*#+|-{3,}|\*{3,})/gm, "");

  // Remove any remaining formatting characters
  description = description.replace(/[|>{}[\]]/g, "");

  // Collapse multiple spaces and trim the text
  description = description.replace(/\s+/g, " ").trim();

  // Limit to the specified maximum length
  description = description.substring(0, maxLength);

  // Escape for HTML safety
  return description
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export const OperationList = () => {
  const { input, type } = useOasConfig();
  const query = useCreateQuery(AllOperationsQuery, { input, type });
  const result = useSuspenseQuery(query);
  const title = result.data.schema.title;
  const summary = result.data.schema.summary;
  const description = result.data.schema.description;
  // The summary property is preferable here as it is a short description of
  // the API, whereas the description property is typically longer and supports
  // commonmark formatting, making it ill-suited for use in the meta description
  const metaDescription = summary
    ? summary
    : description
      ? cleanDescription(description)
      : undefined;
  return (
    <div className="pt-[--padding-content-top]">
      <Helmet>
        <title>{title}</title>
        {metaDescription && (
          <meta name="description" content={metaDescription} />
        )}
      </Helmet>
      <div
        className={cn(ProseClasses, "mb-16 max-w-full prose-img:max-w-prose")}
      >
        <CategoryHeading>Overview</CategoryHeading>
        <Heading level={1} id="description" registerSidebarAnchor>
          {title}
        </Heading>
        <Markdown content={result.data.schema.description ?? ""} />
      </div>
      <hr />
      <div className="my-4 flex justify-end">
        <Endpoint />
      </div>

      {result.data.schema.tags
        .filter((tag) => tag.operations.length > 0)
        .map((tag) => (
          <div key={tag.name} className="[content-visibility:auto]">
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
                    key={fragment.slug}
                    operationFragment={fragment}
                  />
                ))}
              </StaggeredRender>
            </div>
          </div>
        ))}
    </div>
  );
};
