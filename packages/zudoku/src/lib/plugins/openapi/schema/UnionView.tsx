import type { SchemaObject } from "../../../oas/parser/index.js";
import { Badge } from "../../../ui/Badge.js";
import { Card } from "../../../ui/Card.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../ui/Tabs.js";
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
}: {
  variants: SchemaObject[];
  schema: SchemaObject;
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
                <td className="p-2 font-medium">{row.label}</td>
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

const VariantPanel = ({ variant }: { variant: SchemaObject }) => (
  <div className="my-4">
    {variant.description && (
      <p className="text-sm text-muted-foreground">{variant.description}</p>
    )}
    <SchemaView schema={variant} />
  </div>
);

export const UnionView = ({ schema }: { schema: SchemaObject }) => {
  const mode = Array.isArray(schema.oneOf)
    ? "oneOf"
    : Array.isArray(schema.anyOf)
      ? "anyOf"
      : undefined;

  if (!mode) return null;

  const exclusivity = decideExclusivity(schema);
  const variants = unionVariants(schema);

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

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{mode}</Badge>
          <div className="flex-1 p-2">
            <span className="text-sm">{semanticsMessage}</span>
          </div>
        </div>

        <DecisionTable variants={variants} schema={schema} />
      </div>
      <Tabs defaultValue="0" className="w-full px-4">
        <TabsList className="flex w-full">
          {variants.map((v, i) => (
            <TabsTrigger
              key={labelForVariant(i, v)}
              value={String(i)}
              className="flex-1"
            >
              {labelForVariant(i, v)}
            </TabsTrigger>
          ))}
        </TabsList>
        {variants.map((v, i) => (
          <TabsContent
            key={labelForVariant(i, v)}
            value={String(i)}
            className="px-2"
          >
            <VariantPanel variant={v} />
          </TabsContent>
        ))}
      </Tabs>
    </Card>
  );
};
