import { SettingsIcon } from "lucide-react";
import type { ApiIdentity } from "../core/ZudokuContext.js";
import {
  type IdentitySelection,
  identitySelectionToValue,
  NO_IDENTITY,
  valueToIdentitySelection,
} from "../hooks/useIdentityStore.js";
import { Button } from "../ui/Button.js";
import { Label } from "../ui/Label.js";
import { RadioGroup, RadioGroupItem } from "../ui/RadioGroup.js";

export type { IdentitySelection };

const NONE: IdentitySelection = { type: "none" };

export const IdentitySelector = ({
  identities,
  selection = NONE,
  onSelectionChange,
  securitySchemes,
  securityCredentials,
  onConfigureScheme,
}: {
  identities?: ApiIdentity[];
  selection?: IdentitySelection;
  onSelectionChange: (selection: IdentitySelection) => void;
  securitySchemes?: Array<{ name: string; type: string }>;
  securityCredentials?: Record<string, { isAuthorized: boolean }>;
  onConfigureScheme?: (schemeName: string) => void;
}) => (
  <div className="w-full overflow-hidden">
    <RadioGroup
      onValueChange={(value) =>
        onSelectionChange(valueToIdentitySelection(value))
      }
      value={identitySelectionToValue(selection)}
      className="gap-0"
    >
      {[{ id: NO_IDENTITY, label: "None" }, ...(identities ?? [])].map(
        (identity) => (
          <Label
            key={identity.id}
            className="h-10 items-center border-b font-normal flex gap-4 p-4 cursor-pointer hover:bg-accent/75"
          >
            <RadioGroupItem value={identity.id} id={identity.id} />
            <span>{identity.label}</span>
          </Label>
        ),
      )}
      {securitySchemes?.map((scheme) => {
        const schemeId = identitySelectionToValue({
          type: "scheme",
          name: scheme.name,
        });
        const isAuthorized =
          securityCredentials?.[scheme.name]?.isAuthorized ?? false;
        return (
          <Label
            key={schemeId}
            className="h-10 items-center border-b font-normal flex gap-4 p-4 cursor-pointer hover:bg-accent/75"
          >
            <RadioGroupItem value={schemeId} id={schemeId} />
            <span className="flex-1 truncate">
              {scheme.name}
              {!isAuthorized && (
                <span className="text-muted-foreground ml-1.5 text-xs">
                  (not configured)
                </span>
              )}
            </span>
            {onConfigureScheme && (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={(e) => {
                  e.preventDefault();
                  onConfigureScheme(scheme.name);
                }}
              >
                <SettingsIcon size={14} />
              </Button>
            )}
          </Label>
        );
      })}
    </RadioGroup>
  </div>
);

export default IdentitySelector;
