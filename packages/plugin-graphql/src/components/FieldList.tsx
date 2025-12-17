import type { IntrospectionField, IntrospectionInputValue } from "graphql";
import { Markdown } from "zudoku/components";
import { Badge } from "zudoku/ui/Badge.js";
import { useGraphQLSchema } from "../context.js";
import { findType } from "../util/findType.js";
import { unwrapType } from "../util/unwrapType.js";
import { ArgumentList } from "./ArgumentList.js";
import { PropertyGrid, PropertyRow } from "./PropertyGrid.js";
import { TypeBadge } from "./TypeBadge.js";

const COMPLEX_KINDS = ["OBJECT", "INPUT_OBJECT", "INTERFACE"];
const MAX_DEPTH = 3;

const FieldInfos = ({
  field,
}: {
  field: IntrospectionField | IntrospectionInputValue;
}) => (
  <>
    <TypeBadge type={field.type} />
    {"args" in field && field.args.length > 0 && (
      <span className="ms-1 text-muted-foreground text-xs">
        ({field.args.length} {field.args.length === 1 ? "arg" : "args"})
      </span>
    )}
    {field.isDeprecated && (
      <Badge variant="destructive" className="ms-1 text-xs">
        Deprecated
      </Badge>
    )}
  </>
);

const FieldDescription = ({
  field,
  showArguments,
}: {
  field: IntrospectionField | IntrospectionInputValue;
  showArguments: boolean;
}) => {
  const hasArgs = "args" in field && field.args.length > 0 && showArguments;
  const hasContent =
    field.description ||
    (field.isDeprecated && field.deprecationReason) ||
    hasArgs;
  if (!hasContent) return undefined;

  return (
    <>
      {field.description && (
        <Markdown
          className="text-muted-foreground text-sm"
          content={field.description}
        />
      )}
      {field.isDeprecated && field.deprecationReason && (
        <div className="rounded bg-destructive/10 px-2 py-1 text-destructive text-sm">
          <strong>Deprecated:</strong> {field.deprecationReason}
        </div>
      )}
      {hasArgs && "args" in field && (
        <div className="mt-2">
          <ArgumentList args={field.args} />
        </div>
      )}
    </>
  );
};

export const FieldItem = ({
  field,
  showArguments = true,
  depth = 0,
}: {
  field: IntrospectionField | IntrospectionInputValue;
  showArguments?: boolean;
  depth?: number;
}) => {
  const { schema } = useGraphQLSchema();
  const unwrapped = unwrapType(field.type, []);
  const nestedType = findType(unwrapped.name, schema);
  const nestedFields =
    nestedType &&
    COMPLEX_KINDS.includes(nestedType.kind) &&
    "fields" in nestedType
      ? nestedType.fields
      : undefined;
  const isCollapsible = Boolean(
    nestedFields && nestedFields.length > 0 && depth < MAX_DEPTH,
  );

  return (
    <PropertyRow
      name={field.name}
      deprecated={field.isDeprecated}
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
  fields: readonly (IntrospectionField | IntrospectionInputValue)[];
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

export const InputFieldItem = ({
  field,
  depth = 0,
}: {
  field: IntrospectionInputValue;
  depth?: number;
}) => {
  const { schema } = useGraphQLSchema();
  const unwrapped = unwrapType(field.type, []);
  const nestedType = findType(unwrapped.name, schema);
  const nestedInputFields =
    nestedType?.kind === "INPUT_OBJECT" ? nestedType.inputFields : undefined;
  const isCollapsible = Boolean(
    nestedInputFields && nestedInputFields.length > 0 && depth < MAX_DEPTH,
  );

  const hasDefault =
    field.defaultValue !== undefined && field.defaultValue !== null;

  return (
    <PropertyRow
      name={field.name}
      collapsible={isCollapsible}
      infos={
        <>
          <TypeBadge type={field.type} />
          {hasDefault && (
            <span className="ms-1 text-muted-foreground text-xs">
              = {field.defaultValue}
            </span>
          )}
        </>
      }
      description={
        field.description ? (
          <Markdown
            className="text-muted-foreground text-sm"
            content={field.description}
          />
        ) : undefined
      }
    >
      {isCollapsible && nestedInputFields ? (
        <InputFieldList fields={nestedInputFields} depth={depth + 1} />
      ) : undefined}
    </PropertyRow>
  );
};

export const InputFieldList = ({
  fields,
  depth = 0,
}: {
  fields: readonly IntrospectionInputValue[];
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
        <InputFieldItem key={field.name} field={field} depth={depth} />
      ))}
    </PropertyGrid>
  );
};
