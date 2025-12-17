import type {
  IntrospectionField,
  IntrospectionInputValue,
  IntrospectionTypeRef,
} from "graphql";
import virtualSchemas from "virtual:zudoku-graphql-schemas";
import { Heading } from "../../../components/Heading.js";
import { Markdown } from "../../../components/Markdown.js";
import { PropertyItem, PropertyList } from "../../../ui/PropertyList.js";
import {
  expandableFields,
  findType,
  getRootFields,
  type Introspection,
  namedTypeRef,
  renderArgs,
  type RootKind,
  typeRefString,
} from "./introspection.js";

// Cap recursion so cyclic schemas (e.g. User.friends: [User]) can't blow up the render.
const MAX_DEPTH = 10;

// A field or input value, rendered uniformly. Input values have no args.
type Field = IntrospectionField | IntrospectionInputValue;

const fieldArgs = (field: Field): readonly IntrospectionInputValue[] =>
  "args" in field ? field.args : [];

const isExpandable = (
  schema: Introspection,
  typeRef: IntrospectionTypeRef,
  ancestors: ReadonlySet<string>,
  depth: number,
): boolean => {
  if (depth >= MAX_DEPTH) return false;
  const named = namedTypeRef(typeRef);
  if (ancestors.has(named.name)) return false;
  const type = findType(schema, named.name);
  if (!type) return false;
  if (type.kind === "ENUM") return (type.enumValues?.length ?? 0) > 0;
  return expandableFields(type).length > 0;
};

const TypeInfos = ({ field }: { field: Field }) => (
  <span className="inline text-muted-foreground text-sm">
    {typeRefString(field.type)}
  </span>
);

const TypeDetail = ({
  schema,
  typeRef,
  args,
  ancestors,
  depth,
}: {
  schema: Introspection;
  typeRef: IntrospectionTypeRef;
  args: readonly IntrospectionInputValue[];
  ancestors: ReadonlySet<string>;
  depth: number;
}) => {
  const named = namedTypeRef(typeRef);
  const type = findType(schema, named.name);
  const nextAncestors = new Set(ancestors).add(named.name);

  const enumValues = type?.kind === "ENUM" ? (type.enumValues ?? []) : [];
  const fields = type?.kind === "ENUM" ? [] : expandableFields(type);

  return (
    <div className="flex w-full flex-col gap-3">
      {args.length > 0 && (
        <div className="flex flex-col gap-1">
          <div className="text-muted-foreground text-xs font-medium">
            Arguments
          </div>
          <PropertyList embedded>
            {args.map((arg) => (
              <FieldRow
                key={arg.name}
                schema={schema}
                field={arg}
                ancestors={nextAncestors}
                depth={depth + 1}
              />
            ))}
          </PropertyList>
        </div>
      )}
      {enumValues.length > 0 && (
        <PropertyList embedded>
          {enumValues.map((value) => (
            <PropertyItem
              key={value.name}
              name={value.name}
              deprecated={value.isDeprecated}
              description={
                value.description ? (
                  <Markdown className="prose-sm" content={value.description} />
                ) : undefined
              }
            />
          ))}
        </PropertyList>
      )}
      {fields.length > 0 && (
        <PropertyList embedded>
          {fields.map((field) => (
            <FieldRow
              key={field.name}
              schema={schema}
              field={field}
              ancestors={nextAncestors}
              depth={depth + 1}
            />
          ))}
        </PropertyList>
      )}
    </div>
  );
};

const FieldRow = ({
  schema,
  field,
  ancestors,
  depth,
}: {
  schema: Introspection;
  field: Field;
  ancestors: ReadonlySet<string>;
  depth: number;
}) => {
  const args = fieldArgs(field);
  const expandable =
    depth < MAX_DEPTH &&
    (args.length > 0 || isExpandable(schema, field.type, ancestors, depth));

  return (
    <PropertyItem
      name={`${field.name}${renderArgs(args)}`}
      deprecated={field.isDeprecated}
      collapsible={expandable}
      infos={<TypeInfos field={field} />}
      description={
        field.description ? (
          <Markdown className="prose-sm" content={field.description} />
        ) : undefined
      }
    >
      {expandable ? (
        <TypeDetail
          schema={schema}
          typeRef={field.type}
          args={args}
          ancestors={ancestors}
          depth={depth}
        />
      ) : undefined}
    </PropertyItem>
  );
};

const SECTIONS: { kind: RootKind; label: string }[] = [
  { kind: "query", label: "Queries" },
  { kind: "mutation", label: "Mutations" },
  { kind: "subscription", label: "Subscriptions" },
];

export const GraphQLInlineSections = ({
  schemaId,
  slug,
}: {
  schemaId: string;
  slug: string;
}) => {
  const introspection = virtualSchemas[schemaId]?.__schema;
  if (!introspection) return null;

  const sections = SECTIONS.map((section) => ({
    ...section,
    fields: getRootFields(introspection, section.kind),
  })).filter((section) => section.fields.length > 0);

  if (sections.length === 0) return null;

  return (
    <div className="flex flex-col gap-8">
      {sections.map((section) => (
        <div key={section.kind} className="flex flex-col gap-2">
          <Heading level={3} id={`${slug}/${section.kind}`}>
            {section.label}
          </Heading>
          <PropertyList>
            {section.fields.map((field) => (
              <FieldRow
                key={field.name}
                schema={introspection}
                field={field}
                ancestors={new Set()}
                depth={0}
              />
            ))}
          </PropertyList>
        </div>
      ))}
    </div>
  );
};
