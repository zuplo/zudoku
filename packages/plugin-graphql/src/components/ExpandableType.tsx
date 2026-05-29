import type {
  IntrospectionField,
  IntrospectionInputValue,
  IntrospectionTypeRef,
} from "graphql";
import { type ReactNode, useState } from "react";
import { useGraphQLSchema } from "../context.js";
import { unwrapType } from "../util/unwrapType.js";
import { FieldList } from "./FieldList.js";
import { SectionTitle } from "./SectionTitle.js";
import { TypeBadge } from "./TypeBadge.js";

export const ExpandableType = ({
  type,
  label,
}: {
  type: IntrospectionTypeRef;
  label?: ReactNode;
}) => {
  const [open, setOpen] = useState(true);
  const { index } = useGraphQLSchema();

  const unwrapped = unwrapType(type, []);
  const resolvedType = index.getType(unwrapped.name);

  const inputFields: readonly IntrospectionInputValue[] =
    resolvedType?.kind === "INPUT_OBJECT" ? resolvedType.inputFields : [];
  const objectFields: readonly IntrospectionField[] =
    resolvedType?.kind === "OBJECT" || resolvedType?.kind === "INTERFACE"
      ? resolvedType.fields
      : [];
  const isInputType = resolvedType?.kind === "INPUT_OBJECT";
  const hasFields = inputFields.length > 0 || objectFields.length > 0;

  if (!hasFields) {
    return (
      <div className="flex items-baseline gap-2">
        {label && (
          <h3 className="text-xl font-semibold leading-none">{label}</h3>
        )}
        {label && <span className="text-muted-foreground">·</span>}
        <TypeBadge type={type} />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <SectionTitle
        label={label}
        suffix={<TypeBadge type={type} />}
        actions={
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            className="text-xs text-primary hover:underline"
          >
            {open ? "Hide fields" : "Show fields"}
          </button>
        }
      />
      {open ? (
        isInputType ? (
          <FieldList fields={inputFields} depth={1} />
        ) : (
          <FieldList fields={objectFields} showArguments={false} depth={1} />
        )
      ) : null}
    </div>
  );
};
