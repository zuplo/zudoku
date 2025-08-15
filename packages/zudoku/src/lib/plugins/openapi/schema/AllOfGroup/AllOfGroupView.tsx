import * as Collapsible from "@radix-ui/react-collapsible";
import { SquareMinusIcon, SquarePlusIcon } from "lucide-react";
import { useCallback, useState } from "react";
import type { SchemaObject } from "../../../../oas/parser/index.js";
import { Card } from "../../../../ui/Card.js";
import { AllOfGroupItem } from "./AllOfGroupItem.js";

export const AllOfGroupView = ({
  schema,
  cardHeader,
}: {
  schema: SchemaObject;
  cardHeader?: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const toggleOpen = useCallback(() => setIsOpen((prev) => !prev), []);

  if (!schema.allOf) return null;

  return (
    <Collapsible.Root open={isOpen} onOpenChange={toggleOpen} asChild>
      <Card className="overflow-hidden">
        {cardHeader}
        <Collapsible.Trigger className="flex gap-2 items-center py-2 px-6 w-full text-sm text-muted-foreground -translate-x-1.5">
          {isOpen ? (
            <SquareMinusIcon size={14} />
          ) : (
            <SquarePlusIcon size={14} />
          )}
          <span>All of</span>
        </Collapsible.Trigger>

        <Collapsible.Content className="pb-4 px-6">
          {schema.allOf.map((subSchema, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: Index needed for key
            <AllOfGroupItem key={index} schema={subSchema} />
          ))}
        </Collapsible.Content>
      </Card>
    </Collapsible.Root>
  );
};
