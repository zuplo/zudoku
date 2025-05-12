import slugify from "@sindresorhus/slugify";
import { useSuspenseQuery } from "@tanstack/react-query";
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
import { Markdown, ProseClasses } from "../../components/Markdown.js";
import { Toc } from "../../components/navigation/Toc.js";
import { cn } from "../../util/cn.js";
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

  if (!schemas.length) {
    return <div>No schemas found</div>;
  }

  const hasMultipleVersions = Object.entries(versions).length > 1;
  const showVersions =
    options?.showVersionSelect === "always" ||
    (hasMultipleVersions && options?.showVersionSelect !== "hide");

  return (
    <div
      className="grid grid-cols-[--sidecar-grid-cols] gap-8 justify-between"
      data-pagefind-filter="section:openapi"
      data-pagefind-meta="section:openapi"
    >
      <div className="pt-[--padding-content-top] pb-[--padding-content-bottom]">
        <Collapsible className="w-full">
          <div className="flex flex-col gap-y-4 sm:flex-row justify-around items-start sm:items-end">
            <div className="flex-1">
              <CategoryHeading>{data.schema.title}</CategoryHeading>
              <Heading
                level={1}
                id="schemas"
                registerSidebarAnchor
                className="mb-0"
              >
                Schemas
                {showVersions && (
                  <span className="text-xl text-muted-foreground ml-1.5">
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
              <div
                className={cn(
                  ProseClasses,
                  "pt-4 max-w-full prose-img:max-w-prose",
                )}
              >
                <Markdown
                  className="border rounded bg-muted/25 border-border px-2.5 md:px-4"
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
                registerSidebarAnchor
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
