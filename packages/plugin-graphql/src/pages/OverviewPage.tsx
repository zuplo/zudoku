import {
  buildClientSchema,
  type IntrospectionQuery,
  printSchema,
} from "graphql";
import { Head, Heading, Markdown } from "zudoku/components";
import { DownloadIcon, ExternalLinkIcon, PlayIcon } from "zudoku/icons";
import { Link } from "zudoku/router";
import { Badge } from "zudoku/ui/Badge.js";
import { Button } from "zudoku/ui/Button.js";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "zudoku/ui/Item.js";
import { SchemaSearch } from "../components/SchemaSearch.js";
import { useGraphQLSchema } from "../context.js";
import { ROOT_TYPES, type RootType, typeMetadata } from "../util/types.js";

export const OverviewPage = () => {
  const { schema, index, basePath, options } = useGraphQLSchema();

  const getSchemaBlobUrl = () => {
    const sdl = printSchema(
      buildClientSchema({ __schema: schema } as IntrospectionQuery),
    );
    return URL.createObjectURL(new Blob([sdl], { type: "text/plain" }));
  };

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

  return (
    <div className="pt-(--padding-content-top)">
      <Head>
        <title>{title}</title>
      </Head>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <Heading level={1}>{title}</Heading>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={openSchema}>
            <ExternalLinkIcon size={14} aria-hidden="true" />
            Open schema
          </Button>
          <Button variant="outline" onClick={downloadSchema}>
            <DownloadIcon size={14} aria-hidden="true" />
            Download schema
          </Button>
          {options.playground?.enabled !== false && (
            <Button asChild variant="outline">
              <Link to={`${basePath}/playground`}>
                <PlayIcon size={14} fill="currentColor" aria-hidden="true" />
                Playground
              </Link>
            </Button>
          )}
        </div>
      </div>

      {options.description && (
        <div className="mt-4 text-muted-foreground">
          <Markdown content={options.description} />
        </div>
      )}

      <SchemaSearch />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
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
  );
};
