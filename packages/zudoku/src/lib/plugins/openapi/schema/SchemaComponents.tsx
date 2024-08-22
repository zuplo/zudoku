import * as Collapsible from "@radix-ui/react-collapsible";
import { ListPlusIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { Markdown, ProseClasses } from "../../../components/Markdown.js";
import type { SchemaObject } from "../../../oas/parser/index.js";
import { Button } from "../../../ui/Button.js";
import { cn } from "../../../util/cn.js";
import { LogicalGroup } from "./LogicalGroup/LogicalGroup.js";
import { SchemaView } from "./SchemaView.js";
import { hasLogicalGroupings, isComplexType } from "./utils.js";

export type LogicalGroupType = "AND" | "OR" | "ONE";

export const SchemaLogicalGroup = ({
  schema,
  level,
}: {
  schema: SchemaObject;
  level: number;
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const toggleOpen = useCallback(() => setIsOpen((prev) => !prev), []);

  if (schema.allOf) {
    return (
      <LogicalGroup
        schemas={schema.allOf}
        type="AND"
        isOpen={isOpen}
        toggleOpen={toggleOpen}
        level={level}
      />
    );
  }

  if (schema.anyOf) {
    return (
      <LogicalGroup
        schemas={schema.anyOf}
        type="OR"
        isOpen={isOpen}
        toggleOpen={toggleOpen}
        level={level}
      />
    );
  }

  if (schema.oneOf) {
    return (
      <LogicalGroup
        schemas={schema.oneOf}
        type="ONE"
        isOpen={isOpen}
        toggleOpen={toggleOpen}
        level={level}
      />
    );
  }

  return null;

  // const [isOpen, setIsOpen] = useState(true);
  //
  // const renderLogicalGroup = (
  //   group: SchemaObject[],
  //   groupName: string,
  //   separator: "AND" | "OR" | "ONE",
  // ) => {
  //   return (
  //     <Collapsible.Root
  //       defaultOpen
  //       open={isOpen}
  //       onOpenChange={() => setIsOpen(!isOpen)}
  //     >
  //       <Card className="py-4">
  //         {group.map((subSchema, index) => (
  //           <div key={index} className="mx-4">
  //             {index === 0 && (
  //               <Collapsible.Trigger>
  //                 <div className="flex gap-2 items-center text-sm text-muted-foreground">
  //                   <button>
  //                     {isOpen ? (
  //                       <SquareMinusIcon size={14} />
  //                     ) : (
  //                       <SquarePlusIcon size={14} />
  //                     )}
  //                   </button>
  //                   <span>{groupName}</span>
  //                 </div>
  //               </Collapsible.Trigger>
  //             )}
  //             <Collapsible.Content className="pt-2">
  //               <SchemaView schema={subSchema} level={level + 1} />
  //               {index < group.length - 1 && (
  //                 <div
  //                   className={cn(
  //                     {
  //                       "text-green-500 dark:text-green-300/60":
  //                         separator === "AND",
  //                       "text-blue-400 dark:text-blue-500": separator === "OR",
  //                       "text-purple-500 dark:text-purple-300/60":
  //                         separator === "ONE",
  //                     },
  //                     "relative text-sm flex items-center py-4",
  //                     "before:border-l before:absolute before:left-0 before:-top-[8px] before:-bottom-[8px] before:border-border before:border-dashed before:content-['']",
  //                   )}
  //                 >
  //                   {separator === "AND" ? (
  //                     <PlusCircleIcon
  //                       size={16}
  //                       className="-translate-x-1/2 fill-card"
  //                     />
  //                   ) : separator === "OR" ? (
  //                     <CircleDotIcon
  //                       size={16}
  //                       className="-translate-x-1/2 fill-card"
  //                     />
  //                   ) : (
  //                     <CircleIcon
  //                       size={14}
  //                       className="-translate-x-1/2 fill-card"
  //                     />
  //                   )}
  //                   {separator}
  //                 </div>
  //               )}
  //             </Collapsible.Content>
  //           </div>
  //         ))}
  //       </Card>
  //     </Collapsible.Root>
  //   );
  // };
  //
  // if (schema.allOf) return renderLogicalGroup(schema.allOf, "All of", "AND");
  // if (schema.anyOf) return renderLogicalGroup(schema.anyOf, "Any of", "OR");
  // if (schema.oneOf) return renderLogicalGroup(schema.oneOf, "One of", "ONE");

  return null;
};

export const SchemaPropertyItem = ({
  name,
  value,
  group,
  level,
  defaultOpen = false,
  showCollapseButton = true,
}: {
  name: string;
  value: SchemaObject;
  group: "required" | "optional" | "deprecated";
  level: number;
  defaultOpen?: boolean;
  showCollapseButton?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <li className="p-4 bg-border/20 hover:bg-border/30">
      <div className="flex flex-col gap-1 justify-between text-sm">
        <div className="flex gap-2 items-center">
          <code>{name}</code>
          <span className="text-muted-foreground">
            {value.type === "array" && value.items?.type ? (
              <span>{value.items.type}[]</span>
            ) : Array.isArray(value.type) ? (
              <span>{value.type.join(" | ")}</span>
            ) : (
              <span>{value.type}</span>
            )}
          </span>
          {group === "optional" && (
            <span className="py-px px-1.5 font-medium border rounded-lg">
              optional
            </span>
          )}
        </div>

        {value.description && (
          <Markdown
            className={cn(ProseClasses, "text-sm leading-normal line-clamp-4")}
            content={value.description}
          />
        )}

        {(hasLogicalGroupings(value) || isComplexType(value)) && (
          <Collapsible.Root
            defaultOpen={defaultOpen}
            open={isOpen}
            onOpenChange={() => setIsOpen(!isOpen)}
          >
            {showCollapseButton && (
              <Collapsible.Trigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 flex gap-1.5"
                >
                  <ListPlusIcon size={18} />
                  {!isOpen
                    ? "Show nested properties"
                    : "Hide nested properties"}
                </Button>
              </Collapsible.Trigger>
            )}
            <Collapsible.Content>
              <div className="mt-2">
                {hasLogicalGroupings(value) && (
                  <SchemaLogicalGroup schema={value} level={level + 1} />
                )}
                {value.type === "object" && (
                  <SchemaView schema={value} level={level + 1} />
                )}
                {value.type === "array" && typeof value.items === "object" && (
                  <SchemaView schema={value.items} level={level + 1} />
                )}
              </div>
            </Collapsible.Content>
          </Collapsible.Root>
        )}
      </div>
    </li>
  );
};
