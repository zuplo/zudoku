import { ResultOf } from "@graphql-typed-document-node/core";
import { useSuspenseQuery } from "@tanstack/react-query";
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

export const OperationList = () => {
  const { input, type } = useOasConfig();
  const query = useCreateQuery(AllOperationsQuery, { input, type });
  const result = useSuspenseQuery(query);

  return (
    <div className="pt-[--padding-content-top]">
      <div
        className={cn(ProseClasses, "mb-16 max-w-full prose-img:max-w-prose")}
      >
        <CategoryHeading>Overview</CategoryHeading>
        <Heading level={1} id="description" registerSidebarAnchor>
          {result.data.schema.title}
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
