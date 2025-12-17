import * as Collapsible from "@radix-ui/react-collapsible";
import { MinusIcon, PlusIcon } from "lucide-react";
import { Children, Fragment, type ReactNode, useState } from "react";
import { cn } from "../util/cn.js";
import { Button } from "./Button.js";
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
} from "./Frame.js";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
} from "./Item.js";

export const PropertyItem = ({
  name,
  infos,
  description,
  children,
  deprecated = false,
  collapsible: collapsibleProp,
  defaultOpen = false,
  showCollapseButton = true,
}: {
  name: ReactNode;
  infos?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  deprecated?: boolean;
  collapsible?: boolean;
  defaultOpen?: boolean;
  showCollapseButton?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const collapsible = collapsibleProp ?? Boolean(children);
  const nameNode =
    typeof name === "string" ? (
      <code className={cn(deprecated && "line-through")}>{name}</code>
    ) : (
      name
    );

  return (
    <Item
      className={cn(deprecated && "opacity-50 hover:opacity-100 transition")}
    >
      <ItemContent className="gap-y-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <ItemTitle className="!me-0">
            {collapsible ? (
              <button
                onClick={() => setIsOpen(!isOpen)}
                type="button"
                className="hover:underline"
              >
                {nameNode}
              </button>
            ) : (
              nameNode
            )}
          </ItemTitle>
          {infos}
        </div>
        {description && (
          <div className="text-muted-foreground text-sm [&>p]:m-0">
            {description}
          </div>
        )}
      </ItemContent>

      {collapsible && showCollapseButton && (
        <ItemActions className="self-start">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle properties"
          >
            {isOpen ? <MinusIcon size={16} /> : <PlusIcon size={16} />}
          </Button>
        </ItemActions>
      )}

      {collapsible && (
        <Collapsible.Root
          open={isOpen}
          onOpenChange={setIsOpen}
          className={cn("w-full", !isOpen && "contents")}
        >
          <Collapsible.Content asChild>
            <ItemContent>{children}</ItemContent>
          </Collapsible.Content>
        </Collapsible.Root>
      )}
    </Item>
  );
};

export const PropertyList = ({
  children,
  header,
  footer,
  className,
  embedded = false,
}: {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  className?: string;
  embedded?: boolean;
}) => {
  const rows = Children.toArray(children);
  if (rows.length === 0) return null;

  const interleavedRows = rows.map((row, index) => (
    // biome-ignore lint/suspicious/noArrayIndexKey: row order is stable
    <Fragment key={index}>
      {index > 0 && <ItemSeparator />}
      {row}
    </Fragment>
  ));

  if (embedded) {
    return (
      <ItemGroup
        className={cn("overflow-clip [&_[data-slot=item]]:px-0", className)}
      >
        {interleavedRows}
      </ItemGroup>
    );
  }

  return (
    <Frame className={className}>
      {header && (
        <FrameHeader>
          <FrameDescription>{header}</FrameDescription>
        </FrameHeader>
      )}
      <FramePanel className="p-0!">
        <ItemGroup className="overflow-clip">{interleavedRows}</ItemGroup>
      </FramePanel>
      {footer && <FrameFooter>{footer}</FrameFooter>}
    </Frame>
  );
};
