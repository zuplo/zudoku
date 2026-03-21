import { CheckCircle2Icon, SettingsIcon } from "lucide-react";
import { Button } from "zudoku/ui/Button.js";
import { Label } from "zudoku/ui/Label.js";
import { RadioGroup, RadioGroupItem } from "zudoku/ui/RadioGroup.js";
import type { ApiIdentity } from "../../../core/ZudokuContext.js";
import { NO_IDENTITY, SECURITY_SCHEME_IDENTITY } from "./Playground.js";
import type { SecurityCredential } from "./securityCredentialsStore.js";

const IdentitySelector = ({
  identities,
  setValue,
  value,
  securitySchemes,
  securityCredentials,
  onConfigureSecurity,
}: {
  identities?: ApiIdentity[];
  setValue: (value: string) => void;
  value?: string;
  securitySchemes?: Array<{ name: string; type: string }>;
  securityCredentials?: Record<string, SecurityCredential>;
  onConfigureSecurity?: () => void;
}) => {
  const authorizedCount = securityCredentials
    ? Object.values(securityCredentials).filter((c) => c.isAuthorized).length
    : 0;

  return (
    <div className="w-full overflow-hidden">
      <RadioGroup
        onValueChange={(value) => setValue(value)}
        value={value}
        defaultValue={NO_IDENTITY}
        className="gap-0"
        disabled={
          identities?.length === 0 &&
          (!securitySchemes || securitySchemes.length === 0)
        }
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
        {securitySchemes && securitySchemes.length > 0 && (
          <Label
            key={SECURITY_SCHEME_IDENTITY}
            className="h-10 items-center border-b font-normal flex gap-4 p-4 cursor-pointer hover:bg-accent/75"
          >
            <RadioGroupItem
              value={SECURITY_SCHEME_IDENTITY}
              id={SECURITY_SCHEME_IDENTITY}
            />
            <span className="flex items-center gap-2 flex-1">
              API Security
              {authorizedCount > 0 && (
                <CheckCircle2Icon size={14} className="text-green-500" />
              )}
            </span>
            {value === SECURITY_SCHEME_IDENTITY && onConfigureSecurity && (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={(e) => {
                  e.preventDefault();
                  onConfigureSecurity();
                }}
              >
                <SettingsIcon size={14} />
              </Button>
            )}
          </Label>
        )}
      </RadioGroup>
    </div>
  );
};

export default IdentitySelector;
