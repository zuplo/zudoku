import { type ReactNode, useState } from "react";
import { cn } from "zudoku";
import { MinusIcon, PlusIcon } from "zudoku/icons";
import { Button } from "zudoku/ui/Button.js";
import { Collapsible, CollapsibleContent } from "zudoku/ui/Collapsible.js";

const gridColumns =
  "grid-cols-[minmax(0,18rem)_minmax(0,max-content)_minmax(0,1fr)]";

export const PropertyRow = ({
  name,
  infos,
  description,
  children,
  deprecated = false,
  collapsible: collapsibleProp,
  defaultOpen = false,
}: {
  name: ReactNode;
  infos?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  deprecated?: boolean;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const collapsible = collapsibleProp ?? Boolean(children);
  const nameNode =
    typeof name === "string" ? (
      <code
        className={cn(
          "font-semibold text-foreground",
          deprecated && "line-through",
        )}
      >
        {name}
      </code>
    ) : (
      name
    );

  return (
    <div
      className={cn(
        "relative col-span-full grid grid-cols-subgrid items-baseline gap-x-3 py-3 pe-10 text-sm",
        deprecated && "opacity-50 hover:opacity-100 transition",
      )}
    >
      <div className="min-w-0 break-words">
        {collapsible ? (
          <button
            onClick={() => setIsOpen(!isOpen)}
            type="button"
            className="text-left hover:underline"
          >
            {nameNode}
          </button>
        ) : (
          nameNode
        )}
      </div>
      <div className="flex items-center gap-2">{infos}</div>
      <div className="text-muted-foreground min-w-0 [&>p]:m-0 [&>p]:inline">
        {description}
      </div>
      {collapsible && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute end-0 top-1.5 rounded-full"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle properties"
        >
          {isOpen ? <MinusIcon size={16} /> : <PlusIcon size={16} />}
        </Button>
      )}
      {collapsible && (
        <Collapsible
          open={isOpen}
          onOpenChange={setIsOpen}
          className="col-span-full"
        >
          <CollapsibleContent>
            <div className="mt-3 mb-1 rounded-lg border border-border/60 bg-muted/30 px-4">
              {children}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};

export const PropertyGrid = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div
    data-property-grid=""
    className={cn(
      "grid border-y border-border/50 [&_[data-property-grid]]:border-y-0",
      gridColumns,
      className,
    )}
  >
    {children}
  </div>
);
