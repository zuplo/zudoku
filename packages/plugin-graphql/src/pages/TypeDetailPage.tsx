import type {
  IntrospectionEnumType,
  IntrospectionInputObjectType,
  IntrospectionInterfaceType,
  IntrospectionObjectType,
  IntrospectionTypeRef,
  IntrospectionUnionType,
} from "graphql";
import { Heading, Markdown } from "zudoku/components";
import { Link } from "zudoku/router";
import { Badge } from "zudoku/ui/Badge.js";
import { EnumValueList } from "../components/EnumValueList.js";
import { FieldList, InputFieldList } from "../components/FieldList.js";
import { TypeKindBadge } from "../components/TypeBadge.js";
import { useGraphQLSchema } from "../context.js";
import {
  findMutationFields,
  findQueryFields,
  findSubscriptionFields,
  findType,
  type GraphQLSchema,
} from "../util/findType.js";
import { ROOT_TYPES } from "../util/types.js";
import { unwrapType } from "../util/unwrapType.js";

type TypeDetailPageProps = {
  kind: string;
  name: string;
};

export const TypeDetailPage = ({ name }: TypeDetailPageProps) => {
  const { schema, basePath } = useGraphQLSchema();

  const type = findType(name, schema);
  const references = getTypeReferences(name, schema, basePath);

  if (!type) {
    return <div>Type not found: {name}</div>;
  }

  return (
    <div className="pt-(--padding-content-top)">
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
        <InterfaceTypeDetail type={type} basePath={basePath} schema={schema} />
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
      <InputFieldList fields={type.inputFields} />
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
  schema,
}: {
  type: IntrospectionInterfaceType;
  basePath: string;
  schema: GraphQLSchema;
}) => {
  const implementingTypes = schema.types.filter(
    (t): t is IntrospectionObjectType =>
      t.kind === "OBJECT" &&
      (t.interfaces?.some((i) => i.name === type.name) ?? false),
  );

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
            <div className="mb-2 text-sm font-medium">{section.title}</div>
            <div className="flex flex-col gap-1.5">
              {section.items.slice(0, 6).map((item) => (
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
  schema: ReturnType<typeof useGraphQLSchema>["schema"],
  basePath: string,
) => {
  const operations = [
    {
      rootType: ROOT_TYPES.QUERY,
      fields: findQueryFields(schema),
    },
    {
      rootType: ROOT_TYPES.MUTATION,
      fields: findMutationFields(schema),
    },
    {
      rootType: ROOT_TYPES.SUBSCRIPTION,
      fields: findSubscriptionFields(schema),
    },
  ];

  const returnedBy = operations.flatMap(({ rootType, fields }) =>
    fields
      .filter((field) => typeRefContains(field.type, typeName))
      .map((field) => ({
        label: field.name,
        description: rootType,
        to: `${basePath}/${rootType}/${field.name}`,
      })),
  );

  const acceptedBy = operations.flatMap(({ rootType, fields }) =>
    fields.flatMap((field) =>
      field.args
        .filter((arg) => typeRefContains(arg.type, typeName))
        .map((arg) => ({
          label: `${field.name}(${arg.name})`,
          description: rootType,
          to: `${basePath}/${rootType}/${field.name}`,
        })),
    ),
  );

  // Link root operation type fields to the operation page, not the type page.
  const rootOperationKind = (name: string) =>
    name === schema.queryType?.name
      ? ROOT_TYPES.QUERY
      : name === schema.mutationType?.name
        ? ROOT_TYPES.MUTATION
        : name === schema.subscriptionType?.name
          ? ROOT_TYPES.SUBSCRIPTION
          : null;

  const usedByFields = schema.types.flatMap((type) => {
    if (type.name.startsWith("__")) return [];
    const operationKind = rootOperationKind(type.name);
    const rootType =
      operationKind ??
      (type.kind === "OBJECT"
        ? ROOT_TYPES.OBJECT
        : type.kind === "INPUT_OBJECT"
          ? ROOT_TYPES.INPUT_OBJECT
          : type.kind === "INTERFACE"
            ? ROOT_TYPES.INTERFACE
            : null);

    if (!rootType) return [];

    const fields =
      type.kind === "INPUT_OBJECT"
        ? type.inputFields
        : type.kind === "OBJECT" || type.kind === "INTERFACE"
          ? type.fields
          : [];

    return fields
      .filter((field) => typeRefContains(field.type, typeName))
      .map((field) => ({
        label: `${type.name}.${field.name}`,
        description: type.kind,
        to: operationKind
          ? `${basePath}/${operationKind}/${field.name}`
          : `${basePath}/${rootType}/${type.name}`,
      }));
  });

  return {
    returnedBy,
    usedByFields: usedByFields.filter(
      (item) => item.label !== `${typeName}.${item.label.split(".").at(-1)}`,
    ),
    acceptedBy,
  };
};

const typeRefContains = (type: IntrospectionTypeRef, typeName: string) => {
  const unwrapped = unwrapType(type, []);
  return unwrapped.name === typeName;
};
