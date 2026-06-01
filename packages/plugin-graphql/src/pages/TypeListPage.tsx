import { Head, Heading } from "zudoku/components";
import { ExternalLinkIcon } from "zudoku/icons";
import { Link } from "zudoku/router";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "zudoku/ui/Item.js";
import { useGraphQLSchema } from "../context.js";
import type { SchemaIndex } from "../util/schemaIndex.js";
import { ROOT_TYPES, type RootType, typeMetadata } from "../util/types.js";

type TypeListPageProps = {
  kind: string;
};

const getItems = (
  rootType: RootType,
  index: SchemaIndex,
): Array<{ name: string; description?: string | null }> => {
  switch (rootType) {
    case ROOT_TYPES.QUERY:
      return [...index.queryFields];
    case ROOT_TYPES.MUTATION:
      return [...index.mutationFields];
    case ROOT_TYPES.SUBSCRIPTION:
      return [...index.subscriptionFields];
    case ROOT_TYPES.OBJECT:
      return index
        .getTypes(["OBJECT"])
        .filter(
          (t) =>
            t.name !== index.schema.queryType?.name &&
            t.name !== index.schema.mutationType?.name &&
            t.name !== index.schema.subscriptionType?.name,
        );
    case ROOT_TYPES.INPUT_OBJECT:
      return index.getTypes(["INPUT_OBJECT"]);
    case ROOT_TYPES.ENUM:
      return index.getTypes(["ENUM"]);
    case ROOT_TYPES.SCALAR:
      return index.getTypes(["SCALAR"]);
    case ROOT_TYPES.INTERFACE:
      return index.getTypes(["INTERFACE"]);
    case ROOT_TYPES.UNION:
      return index.getTypes(["UNION"]);
  }
};

export const TypeListPage = ({ kind }: TypeListPageProps) => {
  const { index, basePath } = useGraphQLSchema();
  const rootType = kind as RootType;
  const meta = typeMetadata[rootType];
  const items = getItems(rootType, index);

  return (
    <div className="pt-(--padding-content-top)">
      <Head>
        <title>{meta.label}</title>
      </Head>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <Heading level={1} className="text-balance">
            {meta.label}
          </Heading>

          <p className="text-muted-foreground max-w-2xl text-pretty">
            {meta.intro}{" "}
            <a
              href={meta.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline whitespace-nowrap"
            >
              Learn more
              <ExternalLinkIcon size={13} aria-hidden="true" />
            </a>
          </p>
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
    </div>
  );
};
