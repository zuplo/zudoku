import * as Collapsible from "@radix-ui/react-collapsible";
import { useState } from "react";
import type { SchemaObject } from "../../../../oas/parser/index.js";
import { SchemaView } from "../SchemaView.js";
import { AllOfGroupConnector } from "./AllOfGroupConnector.js";

export const AllOfGroupItem = (props: { schema: SchemaObject }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible.Root
      open={isOpen}
      onOpenChange={() => setIsOpen((prev) => !prev)}
      className="group"
    >
      <Collapsible.Trigger>
        <AllOfGroupConnector isOpen={isOpen} schemeName={props.schema.title} />
      </Collapsible.Trigger>
      {!isOpen && <div className="wavy-line bg-border translate-y-1" />}
      <Collapsible.Content>
        <SchemaView schema={props.schema} />
      </Collapsible.Content>
    </Collapsible.Root>
  );
};
