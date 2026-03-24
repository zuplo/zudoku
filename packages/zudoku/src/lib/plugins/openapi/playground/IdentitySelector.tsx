import { SettingsIcon } from "lucide-react";
import { Button } from "zudoku/ui/Button.js";
import { Label } from "zudoku/ui/Label.js";
import { RadioGroup, RadioGroupItem } from "zudoku/ui/RadioGroup.js";
import type { ApiIdentity } from "../../../core/ZudokuContext.js";
import { NO_IDENTITY, SECURITY_SCHEME_PREFIX } from "./Playground.js";
import type { SecurityCredential } from "./securityCredentialsStore.js";

const IdentitySelector = ({
  identities,
  setValue,
  value,
  securitySchemes,
  securityCredentials,
  onConfigureScheme,
}: {
  identities?: ApiIdentity[];
  setValue: (value: string) => void;
  value?: string;
  securitySchemes?: Array<{ name: string; type: string }>;
  securityCredentials?: Record<string, SecurityCredential>;
  onConfigureScheme?: (schemeName: string) => void;
}) => (
  <div className="w-full overflow-hidden">
    <RadioGroup
      onValueChange={(value) => setValue(value)}
      value={value}
      defaultValue={NO_IDENTITY}
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
        const schemeId = `${SECURITY_SCHEME_PREFIX}${scheme.name}`;
        const isAuthorized =
          securityCredentials?.[scheme.name]?.isAuthorized ?? false;
        const isSelected = value === schemeId;
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
            {isSelected && onConfigureScheme && (
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
