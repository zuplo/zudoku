import { ShieldCheckIcon, ShieldCogCornerIcon } from "lucide-react";
import { useState } from "react";
import { useApiIdentitySelection } from "../hooks/useApiIdentitySelection.js";
import {
  useIdentityStore,
  valueToIdentitySelection,
} from "../hooks/useIdentityStore.js";
import { Button } from "../ui/Button.js";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/Popover.js";
import { cn } from "../util/cn.js";
import { IdentitySelector } from "./IdentitySelector.js";

/**
 * Lets users pick the API identity used to authorize playground ("try it")
 * requests; apply the selection with `authorizeRequest` from
 * `useApiIdentitySelection`. Renders nothing when no identities are available.
 */
export const ApiIdentityPicker = ({
  className,
  size = "icon-sm",
  showLabel,
}: {
  className?: string;
  size?: "icon-xs" | "icon-sm";
  // Renders the trigger as a labeled button showing the current selection.
  showLabel?: boolean;
}) => {
  const { identities, selectedIdentity, selectIdentity } =
    useApiIdentitySelection();
  const rememberedIdentity = useIdentityStore((s) => s.rememberedIdentity);
  const [open, setOpen] = useState(false);

  if (identities.length === 0) return null;

  // A security scheme picked in an OpenAPI playground doesn't apply here, but
  // surface it so choosing an option below visibly replaces it.
  const activeScheme = valueToIdentitySelection(rememberedIdentity);
  const schemeNotice =
    activeScheme.type === "scheme" ? activeScheme.name : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={showLabel ? "outline" : "ghost"}
          size={showLabel ? "xs" : size}
          aria-label={showLabel ? undefined : "Select authentication"}
          className={cn("cursor-pointer", showLabel && "gap-1.5", className)}
        >
          {selectedIdentity ? (
            <ShieldCheckIcon className="size-4 text-green-600" />
          ) : (
            <ShieldCogCornerIcon className="size-4 text-muted-foreground" />
          )}
          {showLabel && (
            <span className="text-xs">
              {selectedIdentity?.label ?? "Authentication"}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="p-0 w-76 overflow-hidden">
        <div className="px-4 py-2.5 text-xs text-muted-foreground border-b bg-muted/40">
          Selection syncs across endpoints that support it.
        </div>
        {schemeNotice && (
          <div className="px-4 py-2.5 text-xs text-muted-foreground border-b bg-amber-500/10">
            Selected <code>{schemeNotice}</code> isn't supported for this
            endpoint.
          </div>
        )}
        <IdentitySelector
          identities={identities}
          selection={
            selectedIdentity
              ? { type: "identity", id: selectedIdentity.id }
              : { type: "none" }
          }
          onSelectionChange={(selection) =>
            selectIdentity(selection.type === "identity" ? selection.id : null)
          }
        />
      </PopoverContent>
    </Popover>
  );
};
