import {
  buildClientSchema,
  type IntrospectionQuery,
  printSchema,
} from "graphql";
import { useMemo } from "react";
import { Head, Heading, Markdown } from "zudoku/components";
import {
  ChevronDownIcon,
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
  PlayIcon,
} from "zudoku/icons";
import { Link } from "zudoku/router";
import { Badge } from "zudoku/ui/Badge.js";
import { Button } from "zudoku/ui/Button.js";
import { ButtonGroup } from "zudoku/ui/ButtonGroup.js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "zudoku/ui/DropdownMenu.js";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "zudoku/ui/Item.js";
import { useGraphQLWorkbench } from "../components/GraphQLWorkbench.js";
import { SchemaSearch } from "../components/SchemaSearch.js";
import { useGraphQLSchema } from "../context.js";
import { ROOT_TYPES, type RootType, typeMetadata } from "../util/types.js";

export const OverviewPage = () => {
  const { schema, index, basePath, options } = useGraphQLSchema();
  const { openWorkbench } = useGraphQLWorkbench();

  const sdl = useMemo(
    () =>
      printSchema(
        buildClientSchema({ __schema: schema } as IntrospectionQuery),
      ),
    [schema],
  );

  const getSchemaBlobUrl = () =>
    URL.createObjectURL(new Blob([sdl], { type: "text/plain" }));

  const downloadSchema = () => {
    const url = getSchemaBlobUrl();
    const a = document.createElement("a");
    a.href = url;
    a.download = "schema.graphql";
    a.click();
    URL.revokeObjectURL(url);
  };

  const openSchema = () => {
    const url = getSchemaBlobUrl();
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const copySchema = () => navigator.clipboard.writeText(sdl);

  const objects = index
    .getTypes(["OBJECT"])
    .filter(
      (t) =>
        t.name !== schema.queryType?.name &&
        t.name !== schema.mutationType?.name &&
        t.name !== schema.subscriptionType?.name,
    );

  const counts: Record<RootType, number> = {
    [ROOT_TYPES.QUERY]: index.queryFields.length,
    [ROOT_TYPES.MUTATION]: index.mutationFields.length,
    [ROOT_TYPES.SUBSCRIPTION]: index.subscriptionFields.length,
    [ROOT_TYPES.OBJECT]: objects.length,
    [ROOT_TYPES.INPUT_OBJECT]: index.getTypes(["INPUT_OBJECT"]).length,
    [ROOT_TYPES.ENUM]: index.getTypes(["ENUM"]).length,
    [ROOT_TYPES.SCALAR]: index.getTypes(["SCALAR"]).length,
    [ROOT_TYPES.INTERFACE]: index.getTypes(["INTERFACE"]).length,
    [ROOT_TYPES.UNION]: index.getTypes(["UNION"]).length,
  };

  const categories = (Object.keys(typeMetadata) as RootType[])
    .map((type) => ({ type, count: counts[type], meta: typeMetadata[type] }))
    .filter((c) => c.count > 0);

  const title = options.title ?? "GraphQL API";
  const description = options.description ?? schema.description;

  return (
    <div className="pt-(--padding-content-top)">
      <Head>
        <title>{title}</title>
      </Head>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <Heading level={1} className="text-balance">
              {title}
            </Heading>
            <div className="flex flex-wrap items-center gap-2">
              <ButtonGroup>
                <Button variant="outline" onClick={downloadSchema}>
                  <DownloadIcon size={14} aria-hidden="true" />
                  Download schema
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="px-1.5"
                      aria-label="More schema actions"
                    >
                      <ChevronDownIcon size={14} aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={openSchema}>
                      <ExternalLinkIcon size={14} aria-hidden="true" />
                      Open in new tab
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={copySchema}>
                      <CopyIcon size={14} aria-hidden="true" />
                      Copy schema
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </ButtonGroup>
              {options.playground?.enabled !== false && (
                <Button onClick={() => openWorkbench()}>
                  <PlayIcon size={14} fill="currentColor" aria-hidden="true" />
                  Playground
                </Button>
              )}
            </div>
          </div>

          {description && (
            <div className="text-muted-foreground max-w-2xl text-pretty">
              <Markdown content={description} />
            </div>
          )}
        </div>

        <SchemaSearch />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map(({ type, count, meta }) => (
            <Item key={type} variant="outline" asChild>
              <Link to={`${basePath}/${type}`}>
                <ItemContent>
                  <ItemTitle className="flex items-center justify-between gap-2">
                    <span>{meta.label}</span>
                    <Badge variant="outline" className="font-mono">
                      {count}
                    </Badge>
                  </ItemTitle>
                  <ItemDescription>{meta.description}</ItemDescription>
                </ItemContent>
              </Link>
            </Item>
          ))}
        </div>
      </div>
    </div>
  );
};
