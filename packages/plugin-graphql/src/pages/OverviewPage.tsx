import {
  buildClientSchema,
  type IntrospectionQuery,
  printSchema,
} from "graphql";
import { Heading, Markdown } from "zudoku/components";
import { DownloadIcon, ExternalLinkIcon, PlayIcon } from "zudoku/icons";
import { Link } from "zudoku/router";
import { Badge } from "zudoku/ui/Badge.js";
import { Button } from "zudoku/ui/Button.js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "zudoku/ui/Card.js";
import { SchemaSearch } from "../components/SchemaSearch.js";
import { useGraphQLSchema } from "../context.js";
import {
  findMutationFields,
  findQueryFields,
  findSubscriptionFields,
  findTypes,
} from "../util/findType.js";
import { ROOT_TYPES, typeMetadata } from "../util/types.js";

export const OverviewPage = () => {
  const { schema, basePath, options } = useGraphQLSchema();

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
    window.open(getSchemaBlobUrl(), "_blank", "noopener,noreferrer");
  };

  const queries = findQueryFields(schema);
  const mutations = findMutationFields(schema);
  const subscriptions = findSubscriptionFields(schema);

  const objects = findTypes(schema, ["OBJECT"]).filter(
    (t) =>
      t.name !== schema.queryType?.name &&
      t.name !== schema.mutationType?.name &&
      t.name !== schema.subscriptionType?.name,
  );
  const inputs = findTypes(schema, ["INPUT_OBJECT"]);
  const enums = findTypes(schema, ["ENUM"]);
  const scalars = findTypes(schema, ["SCALAR"]);
  const interfaces = findTypes(schema, ["INTERFACE"]);
  const unions = findTypes(schema, ["UNION"]);

  const categories = [
    {
      type: ROOT_TYPES.QUERY,
      count: queries.length,
      description: "Read data from the API",
    },
    {
      type: ROOT_TYPES.MUTATION,
      count: mutations.length,
      description: "Create, update, or delete data",
    },
    {
      type: ROOT_TYPES.SUBSCRIPTION,
      count: subscriptions.length,
      description: "Subscribe to real-time updates",
    },
    {
      type: ROOT_TYPES.OBJECT,
      count: objects.length,
      description: "Complex types with fields",
    },
    {
      type: ROOT_TYPES.INPUT_OBJECT,
      count: inputs.length,
      description: "Input types for mutations and queries",
    },
    {
      type: ROOT_TYPES.ENUM,
      count: enums.length,
      description: "Sets of predefined values",
    },
    {
      type: ROOT_TYPES.SCALAR,
      count: scalars.length,
      description: "Primitive data types",
    },
    {
      type: ROOT_TYPES.INTERFACE,
      count: interfaces.length,
      description: "Abstract types defining common fields",
    },
    {
      type: ROOT_TYPES.UNION,
      count: unions.length,
      description: "Types that can be one of several object types",
    },
  ].filter((cat) => cat.count > 0);

  return (
    <div className="pt-(--padding-content-top)">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <Heading level={1}>{options.title ?? "GraphQL API"}</Heading>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        {categories.map((cat) => {
          const meta = typeMetadata[cat.type];
          return (
            <Link key={cat.type} to={`${basePath}/${cat.type}`}>
              <Card className="h-full transition-colors hover:bg-accent/50">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{meta.label}</CardTitle>
                    <Badge variant="outline" className="font-mono">
                      {cat.count}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{cat.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
