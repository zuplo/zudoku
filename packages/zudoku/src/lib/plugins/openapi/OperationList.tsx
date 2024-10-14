import { ResultOf } from "@graphql-typed-document-node/core";
import { useQuery } from "urql";
import { CategoryHeading } from "../../components/CategoryHeading.js";
import { DeveloperHint } from "../../components/DeveloperHint.js";
import { ErrorPage } from "../../components/ErrorPage.js";
import { Heading } from "../../components/Heading.js";
import { InlineCode } from "../../components/InlineCode.js";
import { Markdown, ProseClasses } from "../../components/Markdown.js";
import { SyntaxHighlight } from "../../components/SyntaxHighlight.js";
import { cn } from "../../util/cn.js";
import { Endpoint } from "./Endpoint.js";
import { OperationListItem } from "./OperationListItem.js";
import StaggeredRender from "./StaggeredRender.js";
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

const suspenseContext = { suspense: true };

export const OperationList = () => {
  const { type, input } = useOasConfig();

  const [result] = useQuery({
    query: AllOperationsQuery,
    variables: { type, input },
    context: suspenseContext,
  });

  const error = result.error?.graphQLErrors.at(0);

  // Looks like there is no Suspense level error handling (yet)?
  // So we handle the error case in the component directly
  if (error) {
    return (
      <ErrorPage
        category="Error"
        title="Schema cannot be displayed"
        message={
          <>
            <DeveloperHint className="mb-4">
              Check your configuration value <InlineCode>apis.type</InlineCode>{" "}
              and <InlineCode>apis.input</InlineCode> in the Zudoku config.
            </DeveloperHint>
            An error occurred while trying to fetch the API reference:
            <SyntaxHighlight code={error.toString()} language="plain" />
          </>
        }
      />
    );
  }

  if (!result.data) return null;

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
          <div key={tag.name}>
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
