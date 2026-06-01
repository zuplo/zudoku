import type {
  IntrospectionField,
  IntrospectionInputValue,
  IntrospectionTypeRef,
} from "graphql";
import type { ReactNode } from "react";
import { Anchor, Heading } from "zudoku/components";
import { useGraphQLSchema } from "../context.js";
import { unwrapType } from "../util/unwrapType.js";
import { FieldList } from "./FieldList.js";
import { SectionTitle } from "./SectionTitle.js";
import { TypeBadge } from "./TypeBadge.js";

export const ExpandableType = ({
  type,
  label,
  id,
}: {
  type: IntrospectionTypeRef;
  label?: ReactNode;
  id?: string;
}) => {
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
      <Anchor id={id}>
        <div className="flex items-baseline gap-2">
          {label && (
            <Heading level={3} className="leading-none">
              {label}
            </Heading>
          )}
          {label && <span className="text-muted-foreground">·</span>}
          <TypeBadge type={type} />
        </div>
      </Anchor>
    );
  }

  return (
    <div className="flex flex-col">
      <SectionTitle id={id} label={label} suffix={<TypeBadge type={type} />} />
      {isInputType ? (
        <FieldList fields={inputFields} depth={1} />
      ) : (
        <FieldList fields={objectFields} showArguments={false} depth={1} />
      )}
    </div>
  );
};
