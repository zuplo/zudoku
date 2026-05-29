import type {
  IntrospectionEnumType,
  IntrospectionInputObjectType,
  IntrospectionInterfaceType,
  IntrospectionObjectType,
  IntrospectionUnionType,
} from "graphql";
import { joinUrl } from "zudoku";
import { Head, Heading, Markdown } from "zudoku/components";
import { Link } from "zudoku/router";
import { Badge } from "zudoku/ui/Badge.js";
import { EnumValueList } from "../components/EnumValueList.js";
import { FieldList } from "../components/FieldList.js";
import { TypeKindBadge } from "../components/TypeBadge.js";
import { useGraphQLSchema } from "../context.js";
import type { SchemaIndex } from "../util/schemaIndex.js";
import { kindToRootType, ROOT_TYPES, typeMetadata } from "../util/types.js";

type TypeDetailPageProps = {
  kind: string;
  name: string;
};

export const TypeDetailPage = ({ name }: TypeDetailPageProps) => {
  const { index, basePath } = useGraphQLSchema();

  const type = index.getType(name);
  const references = getTypeReferences(name, index, basePath);

  if (!type) {
    return <div>Type not found: {name}</div>;
  }

  const categoryLabel = typeMetadata[kindToRootType[type.kind]]?.label;

  return (
    <div className="pt-(--padding-content-top)">
      <Head>
        <title>
          {categoryLabel ? `${type.name} · ${categoryLabel}` : type.name}
        </title>
      </Head>
      <div className="flex items-center gap-3 mb-2">
        <Heading level={1}>{type.name}</Heading>
        <TypeKindBadge kind={type.kind} />
      </div>

      {type.description && (
        <div className="mt-4 text-muted-foreground">
          <Markdown content={type.description} />
        </div>
      )}

      {type.kind === "OBJECT" && (
        <ObjectTypeDetail type={type} basePath={basePath} />
      )}

      {type.kind === "INPUT_OBJECT" && <InputObjectTypeDetail type={type} />}

      {type.kind === "ENUM" && <EnumTypeDetail type={type} />}

      {type.kind === "SCALAR" && <ScalarTypeDetail />}

      {type.kind === "INTERFACE" && (
        <InterfaceTypeDetail type={type} basePath={basePath} index={index} />
      )}

      {type.kind === "UNION" && (
        <UnionTypeDetail type={type} basePath={basePath} />
      )}

      <TypeReferences references={references} />
    </div>
  );
};

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
        <div className="mt-6">
          <Heading level={3} className="mb-3">
            Implements
          </Heading>
          <div className="flex flex-wrap gap-2">
            {type.interfaces.map((iface) => (
              <Link
                key={iface.name}
                to={`${basePath}/${ROOT_TYPES.INTERFACE}/${iface.name}`}
              >
                <Badge variant="outline" className="font-mono">
                  {iface.name}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}

      {type.fields && type.fields.length > 0 && (
        <div className="mt-6">
          <Heading level={3} className="mb-3">
            Fields
          </Heading>
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
    <div className="mt-6">
      <Heading level={3} className="mb-3">
        Fields
      </Heading>
      <FieldList fields={type.inputFields} />
    </div>
  ) : null;

const EnumTypeDetail = ({ type }: { type: IntrospectionEnumType }) =>
  type.enumValues && type.enumValues.length > 0 ? (
    <div className="mt-6">
      <Heading level={3} className="mb-3">
        Values
      </Heading>
      <EnumValueList values={type.enumValues} />
    </div>
  ) : null;

const ScalarTypeDetail = () => (
  <div className="mt-6">
    <p className="text-muted-foreground">
      This is a scalar type. Scalar types represent primitive values like
      strings, numbers, and booleans.
    </p>
  </div>
);

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
        <div className="mt-6">
          <Heading level={3} className="mb-3">
            Fields
          </Heading>
          <FieldList fields={type.fields} />
        </div>
      )}

      {implementingTypes.length > 0 && (
        <div className="mt-6">
          <Heading level={3} className="mb-3">
            Implemented By
          </Heading>
          <div className="flex flex-wrap gap-2">
            {implementingTypes.map((t) => (
              <Link
                key={t.name}
                to={joinUrl(basePath, ROOT_TYPES.OBJECT, t.name)}
              >
                <Badge variant="outline" className="font-mono">
                  {t.name}
                </Badge>
              </Link>
            ))}
          </div>
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
        <div className="mt-6">
          <Heading level={3} className="mb-3">
            Possible Types
          </Heading>
          <div className="flex flex-wrap gap-2">
            {type.possibleTypes.map((t) => (
              <Link
                key={t.name}
                to={`${basePath}/${ROOT_TYPES.OBJECT}/${t.name}`}
              >
                <Badge variant="outline" className="font-mono">
                  {t.name}
                </Badge>
              </Link>
            ))}
          </div>
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
    <div className="mt-8">
      <Heading level={3} className="mb-3">
        Schema Context
      </Heading>
      <div className="grid gap-3 md:grid-cols-3">
        {sections.map((section) => (
          <div key={section.title} className="rounded-lg border bg-card p-3">
            <div className="mb-2 text-sm font-medium">
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
