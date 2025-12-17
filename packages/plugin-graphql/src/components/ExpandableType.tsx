import type {
  IntrospectionField,
  IntrospectionInputValue,
  IntrospectionTypeRef,
} from "graphql";
import { type ReactNode, useState } from "react";
import { cn } from "zudoku";
import { MinusIcon, PlusIcon } from "zudoku/icons";
import { useGraphQLSchema } from "../context.js";
import { findType } from "../util/findType.js";
import { unwrapType } from "../util/unwrapType.js";
import { FieldList, InputFieldList } from "./FieldList.js";
import { TypeBadge } from "./TypeBadge.js";

const iconTransition =
  "absolute transition-[opacity,scale,filter] duration-200 ease-[cubic-bezier(0.2,0,0,1)]";
const iconOpen = "opacity-100 scale-100 blur-0";
const iconClosed = "opacity-0 scale-[0.25] blur-[4px]";

export const ExpandableType = ({
  type,
  label,
}: {
  type: IntrospectionTypeRef;
  label?: ReactNode;
}) => {
  const [open, setOpen] = useState(true);
  const { schema } = useGraphQLSchema();

  const unwrapped = unwrapType(type, []);
  const resolvedType = findType(unwrapped.name, schema);

  const inputFields: readonly IntrospectionInputValue[] =
    resolvedType?.kind === "INPUT_OBJECT" ? resolvedType.inputFields : [];
  const objectFields: readonly IntrospectionField[] =
    resolvedType?.kind === "OBJECT" || resolvedType?.kind === "INTERFACE"
      ? resolvedType.fields
      : [];
  const isInputType = resolvedType?.kind === "INPUT_OBJECT";
  const hasFields = inputFields.length > 0 || objectFields.length > 0;

  if (!hasFields) {
    return <TypeBadge type={type} linked={false} />;
  }

  const toggle = () => setOpen(!open);

  return (
    <div className="flex flex-col border-y border-border/60">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex items-center justify-between gap-3 py-2.5 text-left hover:opacity-80"
      >
        <span className="flex items-center gap-3">
          {label && (
            <h3 className="text-xl font-semibold leading-none">{label}</h3>
          )}
          <TypeBadge type={type} linked={false} />
        </span>
        <span className="relative flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent">
          <PlusIcon
            size={16}
            className={cn(iconTransition, open ? iconClosed : iconOpen)}
          />
          <MinusIcon
            size={16}
            className={cn(iconTransition, open ? iconOpen : iconClosed)}
          />
        </span>
      </button>
      {open ? (
        isInputType ? (
          <InputFieldList fields={inputFields} depth={1} />
        ) : (
          <FieldList fields={objectFields} showArguments={false} depth={1} />
        )
      ) : null}
    </div>
  );
};
