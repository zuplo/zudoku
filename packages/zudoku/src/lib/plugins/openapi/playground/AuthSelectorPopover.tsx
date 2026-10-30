import { ShieldCheckIcon, ShieldCogCornerIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "zudoku/ui/Button.js";
import { Popover, PopoverContent, PopoverTrigger } from "zudoku/ui/Popover.js";
import IdentitySelector from "../../../components/IdentitySelector.js";
import { useApiIdentitySelection } from "../../../hooks/useApiIdentitySelection.js";
import {
  identitySelectionToValue,
  securitySchemeNamesLabel,
  useIdentityStore,
  valueToIdentitySelection,
} from "../../../hooks/useIdentityStore.js";
import { cn } from "../../../util/cn.js";
import type { OperationsFragmentFragment } from "../graphql/graphql.js";
import {
  findSecurityOption,
  type SecurityOption,
} from "../util/extractOperationSecurityOptions.js";
import { useResolvedAuth } from "../util/useResolvedAuth.js";
import { AuthorizeDialog } from "./AuthorizeDialog.js";
import {
  areSchemesAuthorized,
  useSecurityCredentialsStore,
} from "./securityCredentialsStore.js";

export const AuthSelectorPopover = ({
  operation,
  url,
  securityOptions,
  showLabel,
}: {
  operation: OperationsFragmentFragment;
  url: string;
  securityOptions: SecurityOption[];
  // Renders the trigger as a labeled button instead of an icon-only button.
  showLabel?: boolean;
}) => {
  const { identities, selectedIdentity } = useApiIdentitySelection();
  const rememberedIdentity = useIdentityStore((s) => s.rememberedIdentity);
  const setRememberedIdentity = useIdentityStore(
    (s) => s.setRememberedIdentity,
  );
  const securityCredentials = useSecurityCredentialsStore((s) => s.credentials);

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [authorizeSchemeNames, setAuthorizeSchemeNames] = useState<
    string[] | undefined
  >();

  const resolvedAuth = useResolvedAuth({
    operation,
    identityId: rememberedIdentity,
    identities,
    url,
  });
  const hasResolvedAuth =
    resolvedAuth.headers.length > 0 || resolvedAuth.queryString.length > 0;

  const remembered = valueToIdentitySelection(rememberedIdentity);
  const inapplicableSchemeLabel =
    remembered.type === "scheme" &&
    !findSecurityOption(securityOptions, remembered.names)
      ? securitySchemeNamesLabel(remembered.names)
      : undefined;
  const selection = inapplicableSchemeLabel
    ? { type: "none" as const }
    : remembered;

  if (securityOptions.length === 0 && identities.length === 0) return null;

  const selectedLabel =
    selection.type === "scheme"
      ? securitySchemeNamesLabel(selection.names)
      : (selectedIdentity?.label ?? "Authentication");
  const authorizeSchemes = authorizeSchemeNames
    ? findSecurityOption(securityOptions, authorizeSchemeNames)?.schemes
    : undefined;

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={showLabel ? "outline" : "ghost"}
            size={showLabel ? "xs" : "icon-xs"}
            aria-label={showLabel ? undefined : "Select authentication"}
            className={cn(showLabel && "gap-1.5")}
          >
            {hasResolvedAuth ? (
              <ShieldCheckIcon className="size-4 text-green-600" />
            ) : (
              <ShieldCogCornerIcon className="size-4 text-muted-foreground" />
            )}
            {showLabel && <span className="text-xs">{selectedLabel}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="p-0 w-76 overflow-hidden">
          <div className="px-4 py-2.5 text-xs text-muted-foreground border-b bg-muted/40">
            Selection syncs across endpoints that support it.
          </div>
          {inapplicableSchemeLabel && (
            <div className="px-4 py-2.5 text-xs text-muted-foreground border-b bg-amber-500/10">
              Selected <code>{inapplicableSchemeLabel}</code> isn't supported
              for this endpoint.
            </div>
          )}
          <IdentitySelector
            selection={selection}
            identities={identities}
            onSelectionChange={(next) => {
              setRememberedIdentity(identitySelectionToValue(next));
              if (
                next.type === "scheme" &&
                !areSchemesAuthorized(next.names, securityCredentials)
              ) {
                setPopoverOpen(false);
                setAuthorizeSchemeNames(next.names);
              }
            }}
            securityOptions={
              securityOptions.length > 0 ? securityOptions : undefined
            }
            securityCredentials={securityCredentials}
            onConfigureScheme={(names) => {
              setPopoverOpen(false);
              setAuthorizeSchemeNames(names);
            }}
          />
        </PopoverContent>
      </Popover>
      {authorizeSchemes && (
        <AuthorizeDialog
          securitySchemes={authorizeSchemes}
          open
          onOpenChange={(open) => {
            if (!open) {
              setAuthorizeSchemeNames(undefined);
            }
          }}
        />
      )}
    </>
  );
};
