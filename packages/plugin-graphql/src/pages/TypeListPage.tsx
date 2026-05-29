import { Head, Heading } from "zudoku/components";
import { Link } from "zudoku/router";
import { Badge } from "zudoku/ui/Badge.js";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "zudoku/ui/Item.js";
import { useGraphQLSchema } from "../context.js";
import {
  findMutationFields,
  findQueryFields,
  findSubscriptionFields,
  findTypes,
} from "../util/findType.js";
import { ROOT_TYPES, type RootType, typeMetadata } from "../util/types.js";

type TypeListPageProps = {
  kind: string;
};

const getItems = (
  rootType: RootType,
  schema: ReturnType<typeof useGraphQLSchema>["schema"],
): Array<{ name: string; description?: string | null }> => {
  switch (rootType) {
    case ROOT_TYPES.QUERY:
      return [...findQueryFields(schema)];
    case ROOT_TYPES.MUTATION:
      return [...findMutationFields(schema)];
    case ROOT_TYPES.SUBSCRIPTION:
      return [...findSubscriptionFields(schema)];
    case ROOT_TYPES.OBJECT:
      return findTypes(schema, ["OBJECT"]).filter(
        (t) =>
          t.name !== schema.queryType?.name &&
          t.name !== schema.mutationType?.name &&
          t.name !== schema.subscriptionType?.name,
      );
    case ROOT_TYPES.INPUT_OBJECT:
      return findTypes(schema, ["INPUT_OBJECT"]);
    case ROOT_TYPES.ENUM:
      return findTypes(schema, ["ENUM"]);
    case ROOT_TYPES.SCALAR:
      return findTypes(schema, ["SCALAR"]);
    case ROOT_TYPES.INTERFACE:
      return findTypes(schema, ["INTERFACE"]);
    case ROOT_TYPES.UNION:
      return findTypes(schema, ["UNION"]);
  }
};

export const TypeListPage = ({ kind }: TypeListPageProps) => {
  const { schema, basePath } = useGraphQLSchema();
  const rootType = kind as RootType;
  const meta = typeMetadata[rootType];
  const items = getItems(rootType, schema);

  return (
    <div className="pt-(--padding-content-top)">
      <Head>
        <title>{meta.label}</title>
      </Head>
      <div className="flex items-center gap-3 mb-6">
        <Heading level={1}>{meta.label}</Heading>
        <Badge variant="outline" className="font-mono">
          {items.length}
        </Badge>
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground">
          No {meta.label.toLowerCase()} defined.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => (
            <Item key={item.name} variant="outline" asChild>
              <Link to={`${basePath}/${rootType}/${item.name}`}>
                <ItemContent>
                  <ItemTitle>
                    <code className="font-mono">{item.name}</code>
                  </ItemTitle>
                  {item.description && (
                    <ItemDescription className="line-clamp-2">
                      {item.description}
                    </ItemDescription>
                  )}
                </ItemContent>
              </Link>
            </Item>
          ))}
        </div>
      )}
    </div>
  );
};
