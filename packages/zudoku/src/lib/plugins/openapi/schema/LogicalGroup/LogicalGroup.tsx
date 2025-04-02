import * as Collapsible from "@radix-ui/react-collapsible";
import { SquareMinusIcon, SquarePlusIcon } from "lucide-react";
import type { SchemaObject } from "../../../../oas/parser/index.js";
import { Card } from "../../../../ui/Card.js";
import type { LogicalGroupType } from "../utils.js";
import { LogicalGroupItem } from "./LogicalGroupItem.js";

const typeLabel = {
  AND: "All of",
  OR: "Any of",
  ONE: "One of",
};

export const LogicalGroup = ({
  schemas,
  type,
  isOpen,
  toggleOpen,
}: {
  schemas: SchemaObject[];
  type: LogicalGroupType;
  isOpen: boolean;
  toggleOpen: () => void;
}) => (
  <Collapsible.Root open={isOpen} onOpenChange={toggleOpen} asChild>
    <Card className="px-6">
      <Collapsible.Trigger className="flex gap-2 items-center py-2 w-full text-sm text-muted-foreground -translate-x-1.5">
        {isOpen ? <SquareMinusIcon size={14} /> : <SquarePlusIcon size={14} />}
        <span>{typeLabel[type]}</span>
      </Collapsible.Trigger>

      <Collapsible.Content className="pb-4">
        {schemas.map((subSchema, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <LogicalGroupItem key={index} type={type} schema={subSchema} />
        ))}
      </Collapsible.Content>
    </Card>
  </Collapsible.Root>
);
