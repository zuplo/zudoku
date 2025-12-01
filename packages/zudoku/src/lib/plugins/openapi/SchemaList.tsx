import slugify from "@sindresorhus/slugify";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Helmet } from "@zudoku/react-helmet-async";
import {
  ChevronRightIcon,
  ChevronsDownUpIcon,
  ChevronsUpDownIcon,
} from "lucide-react";
import { Button } from "zudoku/ui/Button.js";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "zudoku/ui/Collapsible.js";
import { CategoryHeading } from "../../components/CategoryHeading.js";
import { Heading } from "../../components/Heading.js";
import { Markdown } from "../../components/Markdown.js";
import { Toc } from "../../components/navigation/Toc.js";
import { PagefindSearchMeta } from "../../components/PagefindSearchMeta.js";
import { useCreateQuery } from "./client/useCreateQuery.js";
import { useOasConfig } from "./context.js";
import { graphql } from "./graphql/gql.js";
import { SchemaView } from "./schema/SchemaView.js";

const GET_SCHEMAS = graphql(/* GraphQL */ `
  query GetSchemas($input: JSON!, $type: SchemaType!) {
    schema(input: $input, type: $type) {
      title
      description
      summary
      components {
        schemas {
          name
          schema
          extensions
        }
      }
    }
  }
`);

export function SchemaList() {
  const { input, type, versions, version, options } = useOasConfig();
  const schemasQuery = useCreateQuery(GET_SCHEMAS, {
    input,
    type,
  });
  const { data } = useSuspenseQuery(schemasQuery);

  const schemas = data.schema.components?.schemas ?? [];
  const hasMultipleVersions = Object.entries(versions).length > 1;
  const showVersions =
    options?.showVersionSelect === "always" ||
    (hasMultipleVersions && options?.showVersionSelect !== "hide");

  if (!schemas.length) {
    return (
      <div>
        <Helmet>
          <title>Schemas {showVersions ? version : ""}</title>
          <meta name="description" content="List of schemas used by the API." />
        </Helmet>
        No schemas found
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-(--sidecar-grid-cols) gap-8 justify-between"
      data-pagefind-filter="section:openapi"
      data-pagefind-meta="section:openapi"
    >
      <PagefindSearchMeta name="category">
        {data.schema.title}
      </PagefindSearchMeta>
      <Helmet>
        <title>Schemas {showVersions ? version : ""}</title>
        <meta name="description" content="List of schemas used by the API." />
      </Helmet>
      <div className="pt-(--padding-content-top) pb-(--padding-content-bottom)">
        <Collapsible className="w-full">
          <div className="flex flex-col gap-y-4 sm:flex-row justify-around items-start sm:items-end">
            <div className="flex-1">
              <CategoryHeading>{data.schema.title}</CategoryHeading>
              <Heading
                level={1}
                id="schemas"
                registerNavigationAnchor
                className="mb-0"
              >
                Schemas
                {showVersions && (
                  <span className="text-xl text-muted-foreground ms-1.5">
                    ({version})
                  </span>
                )}
              </Heading>
            </div>
            {data.schema.description && (
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
          {data.schema.description && (
            <CollapsibleContent className="CollapsibleContent">
              <div className="mt-4 max-w-full border rounded-sm bg-muted/25">
                <Markdown
                  className="max-w-full prose-img:max-w-prose border-border p-3 lg:p-5"
                  content={data.schema.description}
                />
              </div>
            </CollapsibleContent>
          )}
        </Collapsible>
        <hr className="my-8" />
        <div className="flex flex-col gap-y-5">
          {schemas.map((schema) => (
            <Collapsible key={schema.name} className="group" defaultOpen>
              <Heading
                registerNavigationAnchor
                level={2}
                className="flex items-center gap-1 justify-between w-fit"
                id={slugify(schema.name)}
              >
                {schema.name}{" "}
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-6">
                    <ChevronRightIcon
                      size={16}
                      className="group-data-[state=open]:rotate-90 transition cursor-pointer"
                    />
                  </Button>
                </CollapsibleTrigger>
              </Heading>
              <CollapsibleContent className="mt-4 CollapsibleContent">
                <SchemaView schema={schema.schema} />
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </div>
      <Toc
        entries={schemas.map((schema) => ({
          id: slugify(schema.name),
          value: schema.name,
          depth: 1,
        }))}
      />
    </div>
  );
}
