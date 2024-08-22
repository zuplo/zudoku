import * as Collapsible from "@radix-ui/react-collapsible";
import { SquareMinusIcon, SquarePlusIcon } from "lucide-react";
import type { SchemaObject } from "../../../../oas/parser/index.js";
import { Card } from "../../../../ui/Card.js";
import type { LogicalGroupType } from "../SchemaComponents.js";
import { SchemaView } from "../SchemaView.js";
import { LogicalGroupConnector } from "./LogicalGroupConnector.js";

const typeLabel = {
  AND: "All of",
  OR: "Any of",
  ONE: "One of",
};

export const LogicalGroup = ({
  schemas,
  type,
  isOpen,
  level,
  toggleOpen,
}: {
  schemas: SchemaObject[];
  type: LogicalGroupType;
  isOpen: boolean;
  toggleOpen: () => void;
  level: number;
}) => (
  <Collapsible.Root open={isOpen} onOpenChange={toggleOpen} asChild>
    <Card>
      <Collapsible.Trigger className="flex gap-2 items-center px-4 py-2 w-full text-sm text-muted-foreground">
        {isOpen ? <SquareMinusIcon size={14} /> : <SquarePlusIcon size={14} />}
        <span>{typeLabel[type]}</span>
      </Collapsible.Trigger>

      <Collapsible.Content className="pb-4">
        {schemas.map((subSchema, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <div key={index} className="mx-4">
            <SchemaView schema={subSchema} level={level + 1} />

            {index < schemas.length - 1 && (
              <LogicalGroupConnector type={type} />
            )}
          </div>
        ))}
      </Collapsible.Content>
    </Card>
  </Collapsible.Root>
);
