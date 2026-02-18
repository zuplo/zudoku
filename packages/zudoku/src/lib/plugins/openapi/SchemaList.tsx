import slugify from "@sindresorhus/slugify";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Helmet } from "@zudoku/react-helmet-async";
import { ChevronRightIcon } from "lucide-react";
import { Button } from "zudoku/ui/Button.js";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "zudoku/ui/Collapsible.js";
import { Heading } from "../../components/Heading.js";
import { Toc } from "../../components/navigation/Toc.js";
import { PagefindSearchMeta } from "../../components/PagefindSearchMeta.js";
import { ApiHeader } from "./ApiHeader.js";
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

  const title = data.schema.title;
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
      <PagefindSearchMeta name="category">{title}</PagefindSearchMeta>
      <Helmet>
        <title>Schemas {showVersions ? version : ""}</title>
        <meta name="description" content="List of schemas used by the API." />
      </Helmet>
      <div className="pt-(--padding-content-top) pb-(--padding-content-bottom)">
        <ApiHeader
          title={title}
          heading="Schemas"
          headingId="schemas"
          description={data.schema.description ?? undefined}
        />
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
