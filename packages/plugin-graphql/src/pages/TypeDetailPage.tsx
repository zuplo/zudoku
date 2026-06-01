import type {
  IntrospectionEnumType,
  IntrospectionInputObjectType,
  IntrospectionInterfaceType,
  IntrospectionObjectType,
  IntrospectionScalarType,
  IntrospectionUnionType,
} from "graphql";
import { useMemo } from "react";
import { cn, joinUrl } from "zudoku";
import { Head, Heading } from "zudoku/components";
import { ExternalLinkIcon } from "zudoku/icons";
import { Link } from "zudoku/router";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "zudoku/ui/Item.js";
import * as SidecarBox from "zudoku/ui/SidecarBox.js";
import { SyntaxHighlight } from "zudoku/ui/SyntaxHighlight.js";
import { DetailPageHeader } from "../components/DetailPageHeader.js";
import { EnumValueList } from "../components/EnumValueList.js";
import { FieldList } from "../components/FieldList.js";
import { useGraphQLSchema } from "../context.js";
import { generateGraphQLTypeFragment } from "../util/generateOperation.js";
import type { SchemaIndex } from "../util/schemaIndex.js";
import {
  kindToRootType,
  ROOT_TYPES,
  type RootType,
  typeMetadata,
} from "../util/types.js";

type TypeDetailPageProps = {
  kind: string;
  name: string;
};

export const TypeDetailPage = ({ name }: TypeDetailPageProps) => {
  const { index, basePath } = useGraphQLSchema();

  const type = index.getType(name);
  const references = getTypeReferences(name, index, basePath);

  const example = useMemo(
    () => (type ? generateGraphQLTypeFragment({ type, index }) : undefined),
    [type, index],
  );

  if (!type) {
    return <div>Type not found: {name}</div>;
  }

  const meta = typeMetadata[kindToRootType[type.kind]];
  const categoryLabel = meta?.label;
  const kindLabel =
    meta?.labelSingular.toLowerCase() ?? type.kind.toLowerCase();

  return (
    <div className="pt-(--padding-content-top)">
      <Head>
        <title>
          {categoryLabel ? `${type.name} · ${categoryLabel}` : type.name}
        </title>
      </Head>
      <div
        className={cn(
          example && "grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px]",
        )}
      >
        <div className="min-w-0 flex flex-col gap-6">
          <DetailPageHeader
            name={type.name}
            label={kindLabel}
            description={type.description}
          />

          {type.kind === "OBJECT" && (
            <ObjectTypeDetail type={type} basePath={basePath} />
          )}

          {type.kind === "INPUT_OBJECT" && (
            <InputObjectTypeDetail type={type} />
          )}

          {type.kind === "ENUM" && <EnumTypeDetail type={type} />}

          {type.kind === "SCALAR" && <ScalarTypeDetail type={type} />}

          {type.kind === "INTERFACE" && (
            <InterfaceTypeDetail
              type={type}
              basePath={basePath}
              index={index}
            />
          )}

          {type.kind === "UNION" && (
            <UnionTypeDetail type={type} basePath={basePath} />
          )}

          <TypeReferences references={references} />
        </div>

        {example && (
          <aside className="min-w-0 xl:sticky xl:top-(--scroll-padding) xl:self-start">
            <ExampleSidecar code={example} />
          </aside>
        )}
      </div>
    </div>
  );
};

const ExampleSidecar = ({ code }: { code: string }) => (
  <SidecarBox.Root>
    <SidecarBox.Head className="text-xs py-1.5">
      <span className="font-medium">Example</span>
    </SidecarBox.Head>
    <SidecarBox.Body className="p-0">
      <SyntaxHighlight
        embedded
        code={code}
        language="graphql"
        showLanguageIndicator={false}
        className="scrollbar rounded-none border-0 max-h-100 text-xs overflow-auto"
      />
    </SidecarBox.Body>
  </SidecarBox.Root>
);

const ObjectTypeDetail = ({
  type,
  basePath,
}: {
  type: IntrospectionObjectType;
  basePath: string;
}) => {
  return (
    <>
      {type.interfaces && type.interfaces.length > 0 && (
        <div className="flex flex-col gap-3">
          <Heading level={3}>Implements</Heading>
          <TypeCardGrid
            types={type.interfaces}
            basePath={basePath}
            kind={ROOT_TYPES.INTERFACE}
          />
        </div>
      )}

      {type.fields && type.fields.length > 0 && (
        <div className="flex flex-col gap-3">
          <Heading level={3}>Fields</Heading>
          <FieldList fields={type.fields} />
        </div>
      )}
    </>
  );
};

const InputObjectTypeDetail = ({
  type,
}: {
  type: IntrospectionInputObjectType;
}) =>
  type.inputFields && type.inputFields.length > 0 ? (
    <div className="flex flex-col gap-3">
      <Heading level={3}>Fields</Heading>
      <FieldList fields={type.inputFields} />
    </div>
  ) : null;

const EnumTypeDetail = ({ type }: { type: IntrospectionEnumType }) =>
  type.enumValues && type.enumValues.length > 0 ? (
    <div className="flex flex-col gap-3">
      <Heading level={3}>Values</Heading>
      <EnumValueList values={type.enumValues} />
    </div>
  ) : null;

const ScalarTypeDetail = ({ type }: { type: IntrospectionScalarType }) => (
  <div className="flex flex-col gap-3">
    <p className="text-muted-foreground">
      This is a scalar type. Scalar types represent primitive values like
      strings, numbers, and booleans.
    </p>
    {type.specifiedByURL && (
      <a
        href={type.specifiedByURL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-fit items-center gap-1 text-primary hover:underline"
      >
        Specification
        <ExternalLinkIcon size={13} aria-hidden="true" />
      </a>
    )}
  </div>
);

const TypeCardGrid = ({
  types,
  basePath,
  kind,
}: {
  types: readonly { name: string }[];
  basePath: string;
  kind: RootType;
}) => {
  const { index } = useGraphQLSchema();

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {types.map(({ name }) => {
        const description = index.getType(name)?.description;
        return (
          <Item key={name} variant="outline" asChild>
            <Link to={joinUrl(basePath, kind, name)}>
              <ItemContent>
                <ItemTitle>
                  <code className="font-mono">{name}</code>
                </ItemTitle>
                {description && (
                  <ItemDescription className="line-clamp-2">
                    {description}
                  </ItemDescription>
                )}
              </ItemContent>
            </Link>
          </Item>
        );
      })}
    </div>
  );
};

const InterfaceTypeDetail = ({
  type,
  basePath,
  index,
}: {
  type: IntrospectionInterfaceType;
  basePath: string;
  index: SchemaIndex;
}) => {
  const implementingTypes = index.implementedBy(type.name);

  return (
    <>
      {type.fields && type.fields.length > 0 && (
        <div className="flex flex-col gap-3">
          <Heading level={3}>Fields</Heading>
          <FieldList fields={type.fields} />
        </div>
      )}

      {implementingTypes.length > 0 && (
        <div className="flex flex-col gap-3">
          <Heading level={3}>Implemented By</Heading>
          <TypeCardGrid
            types={implementingTypes}
            basePath={basePath}
            kind={ROOT_TYPES.OBJECT}
          />
        </div>
      )}
    </>
  );
};

const UnionTypeDetail = ({
  type,
  basePath,
}: {
  type: IntrospectionUnionType;
  basePath: string;
}) => {
  return (
    <>
      {type.possibleTypes && type.possibleTypes.length > 0 && (
        <div className="flex flex-col gap-3">
          <Heading level={3}>Possible Types</Heading>
          <TypeCardGrid
            types={type.possibleTypes}
            basePath={basePath}
            kind={ROOT_TYPES.OBJECT}
          />
        </div>
      )}
    </>
  );
};

type TypeReference = {
  label: string;
  description: string;
  to: string;
};

const TypeReferences = ({
  references,
}: {
  references: {
    returnedBy: TypeReference[];
    usedByFields: TypeReference[];
    acceptedBy: TypeReference[];
  };
}) => {
  const sections = [
    { title: "Returned By", items: references.returnedBy },
    { title: "Used By Fields", items: references.usedByFields },
    { title: "Accepted By", items: references.acceptedBy },
  ].filter((section) => section.items.length > 0);

  if (sections.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <Heading level={3}>Schema Context</Heading>
      <div className="grid gap-3 md:grid-cols-[repeat(auto-fit,minmax(0,1fr))]">
        {sections.map((section) => (
          <div
            key={section.title}
            className="flex flex-col gap-2 rounded-lg border bg-card p-3"
          >
            <div className="text-sm font-medium">
              {section.title}
              <span className="ms-2 text-muted-foreground text-xs">
                {section.items.length}
              </span>
            </div>
            <div className="scrollbar flex max-h-80 flex-col gap-1.5 overflow-y-auto">
              {section.items.map((item) => (
                <Link
                  key={`${item.to}:${item.label}`}
                  to={item.to}
                  className="rounded-md px-2 py-1.5 hover:bg-accent"
                >
                  <div className="truncate font-mono text-sm font-semibold">
                    {item.label}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {item.description}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const getTypeReferences = (
  typeName: string,
  index: SchemaIndex,
  basePath: string,
) => {
  const refs = index.typeReferences(typeName);

  return {
    returnedBy: refs.returnedBy.map((ref) => ({
      label: ref.fieldName,
      description: ref.rootType,
      to: `${basePath}/${ref.rootType}/${ref.fieldName}`,
    })),
    acceptedBy: refs.acceptedBy.map((ref) => ({
      label: `${ref.fieldName}(${ref.argName})`,
      description: ref.rootType,
      to: `${basePath}/${ref.rootType}/${ref.fieldName}`,
    })),
    // Self-references are shown inline on the type itself, so skip them here.
    usedByFields: refs.usedByFields
      .filter((ref) => ref.ownerName !== typeName)
      .map((ref) => ({
        label: ref.label,
        description: ref.ownerKind,
        to: `${basePath}/${ref.linkKind}/${ref.linkName}`,
      })),
  };
};
