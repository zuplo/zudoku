import { type ReactNode, useState } from "react";
import { LinkIcon, MinusIcon, PlusIcon } from "zudoku/icons";
import { Button } from "zudoku/ui/Button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "zudoku/ui/Collapsible.js";
import { DeprecatedBadge, DeprecationReason } from "./Deprecation.js";

export const PropertyRow = ({
  id,
  name,
  infos,
  description,
  children,
  deprecated = false,
  deprecationReason,
  collapsible: collapsibleProp,
  defaultOpen = false,
}: {
  id?: string;
  name: ReactNode;
  infos?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  deprecated?: boolean;
  deprecationReason?: string | null;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [reasonOpen, setReasonOpen] = useState(false);
  const collapsible = collapsibleProp ?? Boolean(children);

  const nameNode =
    typeof name === "string" ? (
      <code className="font-mono text-foreground bg-muted/60 rounded px-1.5 py-0.5 text-[0.8125rem]">
        {name}
      </code>
    ) : (
      name
    );

  return (
    <div id={id} className="relative scroll-mt-(--scroll-padding) py-3 text-sm">
      <Collapsible open={reasonOpen} onOpenChange={setReasonOpen}>
        <div className="group/row flex flex-wrap items-baseline gap-1.5">
          {id && (
            <div className="absolute -inset-s-5 top-3.5 bottom-0 text-muted-foreground">
              <a
                href={`#${id}`}
                aria-label={`Link to ${id}`}
                className="bg-background rounded p-1 -m-1 inline-block opacity-0 group-hover/row:opacity-100 hover:text-primary"
              >
                <LinkIcon className="size-3.5" />
              </a>
            </div>
          )}
          {nameNode}
          {infos && <span className="text-muted-foreground/75">&middot;</span>}
          {infos && (
            <span className="inline-flex flex-wrap items-baseline gap-2 min-w-0">
              {infos}
            </span>
          )}
          {deprecated && <DeprecatedBadge className="ms-0.5" />}
          {deprecated && deprecationReason && (
            <CollapsibleTrigger asChild>
              <button
                type="button"
                aria-label={
                  reasonOpen
                    ? "Hide deprecation details"
                    : "Show deprecation details"
                }
                className="inline-flex size-5 items-center justify-center rounded bg-muted/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {reasonOpen ? <MinusIcon size={12} /> : <PlusIcon size={12} />}
              </button>
            </CollapsibleTrigger>
          )}
        </div>
        {deprecated && deprecationReason && (
          <CollapsibleContent className="mt-2">
            <DeprecationReason reason={deprecationReason} />
          </CollapsibleContent>
        )}
      </Collapsible>
      {description && (
        <div className="text-muted-foreground mt-1 [&>p]:m-0 [&>p]:inline">
          {description}
        </div>
      )}
      {collapsible && (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="link"
              type="button"
              className="mt-2 px-0"
              size="xs"
            >
              {isOpen ? "Hide fields" : "Show fields"}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 mb-1 border-l-2 border-border/60 ps-4">
              {children}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};

export const PropertyGrid = ({ children }: { children: ReactNode }) => (
  <div data-property-grid="" className="divide-y divide-border/50">
    {children}
  </div>
);
