import { useState } from "react";
import type { SchemaObject } from "../../../oas/parser/index.js";
import { Badge } from "../../../ui/Badge.js";
import { Frame, FramePanel } from "../../../ui/Frame.js";
import { cn } from "../../../util/cn.js";
import { SchemaView } from "./SchemaView.js";
import {
  decideExclusivity,
  labelForVariant,
  quickGuards,
  unionVariants,
} from "./union-helpers.js";

const DecisionTable = ({
  variants,
  schema,
  selectedVariant,
  onSelectVariant,
}: {
  variants: SchemaObject[];
  schema: SchemaObject;
  selectedVariant: string;
  onSelectVariant: (label: string) => void;
}) => {
  const rows = variants.map((v, i) => ({
    label: labelForVariant(i, v),
    guards: quickGuards(v, schema),
  }));

  return (
    <div className="flex flex-col gap-2 text-sm">
      <h4 className="font-medium">Decision Table</h4>
      <div className="border rounded-md overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-2 font-medium">Variant</th>
              <th className="text-left p-2 font-medium">Matching Criteria</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row.label} className="hover:bg-muted/30">
                <td className="p-2 font-medium">
                  <button
                    type="button"
                    className={cn(
                      "hover:underline",
                      selectedVariant === row.label && "text-primary",
                    )}
                    onClick={() => onSelectVariant(row.label)}
                  >
                    {row.label}
                  </button>
                </td>
                <td className="p-2 text-muted-foreground text-xs">
                  {row.guards.length > 0
                    ? row.guards.join(" · ")
                    : "No specific criteria"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const UnionView = ({
  schema,
  cardHeader,
}: {
  schema: SchemaObject;
  cardHeader?: React.ReactNode;
}) => {
  const mode = Array.isArray(schema.oneOf)
    ? "oneOf"
    : Array.isArray(schema.anyOf)
      ? "anyOf"
      : undefined;

  const variants = mode ? unionVariants(schema) : [];
  const [selectedVariant, setSelectedVariant] = useState(() =>
    variants[0] ? labelForVariant(0, variants[0]) : "",
  );

  if (!mode) return null;

  const exclusivity = decideExclusivity(schema);

  const semanticsMessage =
    exclusivity === "exactly-one" ? (
      <>
        Exactly one variant <b>must match</b>.
      </>
    ) : (
      <>
        At least one variant <b>must match</b>. Multiple variants{" "}
        <i>may match</i> simultaneously.
      </>
    );

  const currentVariantIndex = variants.findIndex(
    (v, i) => labelForVariant(i, v) === selectedVariant,
  );
  const currentVariant =
    currentVariantIndex >= 0 ? variants[currentVariantIndex] : null;

  return (
    <Frame>
      {cardHeader}
      <FramePanel className="text-sm flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{mode}</Badge>
          <div className="flex-1 p-2">
            <span className="text-sm">{semanticsMessage}</span>
          </div>
        </div>

        <DecisionTable
          variants={variants}
          schema={schema}
          selectedVariant={selectedVariant}
          onSelectVariant={setSelectedVariant}
        />
        <strong>Properties for {selectedVariant}:</strong>
        {currentVariant && <SchemaView schema={currentVariant} />}
      </FramePanel>
    </Frame>
  );
};
