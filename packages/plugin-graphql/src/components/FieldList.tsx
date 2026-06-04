import type { IntrospectionField, IntrospectionInputValue } from "graphql";
import { Markdown } from "zudoku/components";
import { useGraphQLSchema } from "../context.js";
import type { SchemaIndex } from "../util/schemaIndex.js";
import { unwrapType } from "../util/unwrapType.js";
import { ArgumentList } from "./ArgumentList.js";
import { PropertyGrid, PropertyRow } from "./PropertyGrid.js";
import { TypeBadge } from "./TypeBadge.js";

type AnyField = IntrospectionField | IntrospectionInputValue;

const COMPLEX_KINDS = ["OBJECT", "INPUT_OBJECT", "INTERFACE"];
const MAX_DEPTH = 3;

const isField = (f: AnyField): f is IntrospectionField => "args" in f;

const getNestedFields = (
  field: AnyField,
  index: SchemaIndex,
): readonly AnyField[] | undefined => {
  const unwrapped = unwrapType(field.type, []);
  const nested = index.getType(unwrapped.name);
  if (!nested) return undefined;
  if (isField(field)) {
    return COMPLEX_KINDS.includes(nested.kind) && "fields" in nested
      ? nested.fields
      : undefined;
  }
  return nested.kind === "INPUT_OBJECT" ? nested.inputFields : undefined;
};

const FieldInfos = ({ field }: { field: AnyField }) => {
  const hasDefault =
    !isField(field) &&
    field.defaultValue !== undefined &&
    field.defaultValue !== null;

  return (
    <>
      <TypeBadge type={field.type} />
      {isField(field) && field.args.length > 0 && (
        <span className="ms-1 text-muted-foreground text-xs">
          ({field.args.length} {field.args.length === 1 ? "arg" : "args"})
        </span>
      )}
      {hasDefault && (
        <span className="ms-1 text-muted-foreground text-xs">
          = {field.defaultValue}
        </span>
      )}
    </>
  );
};

const FieldDescription = ({
  field,
  showArguments,
}: {
  field: AnyField;
  showArguments: boolean;
}) => {
  const hasArgs = isField(field) && field.args.length > 0 && showArguments;
  const hasContent = field.description || hasArgs;
  if (!hasContent) return undefined;

  return (
    <>
      {field.description && (
        <Markdown
          className="text-muted-foreground text-sm"
          content={field.description}
        />
      )}
      {hasArgs && isField(field) && (
        <div className="mt-2">
          <ArgumentList args={field.args} />
        </div>
      )}
    </>
  );
};

const FieldItem = ({
  field,
  showArguments = true,
  depth = 0,
}: {
  field: AnyField;
  showArguments?: boolean;
  depth?: number;
}) => {
  const { index } = useGraphQLSchema();
  const nestedFields = getNestedFields(field, index);
  const isCollapsible = Boolean(
    nestedFields && nestedFields.length > 0 && depth < MAX_DEPTH,
  );
  const idPrefix = isField(field) ? "field" : "arg";

  return (
    <PropertyRow
      id={depth <= 1 ? `${idPrefix}-${field.name}` : undefined}
      name={field.name}
      deprecated={Boolean(field.isDeprecated)}
      deprecationReason={field.deprecationReason}
      collapsible={isCollapsible}
      infos={<FieldInfos field={field} />}
      description={
        <FieldDescription field={field} showArguments={showArguments} />
      }
    >
      {isCollapsible && nestedFields ? (
        <FieldList
          fields={nestedFields}
          showArguments={showArguments}
          depth={depth + 1}
        />
      ) : undefined}
    </PropertyRow>
  );
};

export const FieldList = ({
  fields,
  showArguments = true,
  depth = 0,
}: {
  fields: readonly AnyField[];
  showArguments?: boolean;
  depth?: number;
}) => {
  if (fields.length === 0) {
    return (
      <p className="text-muted-foreground text-sm italic">No fields defined.</p>
    );
  }

  return (
    <PropertyGrid>
      {fields.map((field) => (
        <FieldItem
          key={field.name}
          field={field}
          showArguments={showArguments}
          depth={depth}
        />
      ))}
    </PropertyGrid>
  );
};
