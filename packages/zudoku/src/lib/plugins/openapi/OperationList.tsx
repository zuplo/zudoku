import { ResultOf } from "@graphql-typed-document-node/core";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Helmet } from "@zudoku/react-helmet-async";
import { useNavigate } from "react-router";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "zudoku/ui/Select.js";
import { useSelectedServerStore } from "../../authentication/state.js";
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

export const OperationList = () => {
  const { input, type, versions, version } = useOasConfig();
  const query = useCreateQuery(AllOperationsQuery, { input, type });
  const { selectedServer } = useSelectedServerStore();
  const result = useSuspenseQuery(query);
  const title = result.data.schema.title;
  const summary = result.data.schema.summary;
  const description = result.data.schema.description;
  const navigate = useNavigate();

  // The summary property is preferable here as it is a short description of
  // the API, whereas the description property is typically longer and supports
  // commonmark formatting, making it ill-suited for use in the meta description
  const metaDescription = summary
    ? summary
    : description
      ? sanitizeMarkdownForMetatag(description)
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
        <div className="flex">
          <div className="flex-1">
            <CategoryHeading>Overview</CategoryHeading>
            <Heading level={1} id="description" registerSidebarAnchor>
              {title}
            </Heading>
          </div>
          <div>
            {Object.entries(versions).length > 1 && (
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
          </div>
        </div>
        <Markdown content={result.data.schema.description ?? ""} />
      </div>
      <hr />
      <div className="my-4 flex items-center justify-end gap-4">
        <Endpoint />
      </div>
      {result.data.schema.tags
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
                    serverUrl={selectedServer ?? result.data.schema.url}
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
