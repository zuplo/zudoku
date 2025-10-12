import { LockKeyholeIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "zudoku/ui/Button.js";
import { Input } from "zudoku/ui/Input.js";
import { Label } from "zudoku/ui/Label.js";
import { RadioGroup, RadioGroupItem } from "zudoku/ui/RadioGroup.js";
import type { SecurityRequirement } from "../graphql/graphql.js";
import {
  type SecuritySchemeSelection,
  useSecurityState,
} from "../state/securityState.js";
import { getSchemeInfo, inferSchemeType } from "../util/authHelpers.js";

const NO_AUTH = "__none";

export const AuthorizationSelector = ({
  operationId,
  security,
  onAuthChange,
}: {
  operationId: string;
  security: SecurityRequirement[];
  onAuthChange?: (scheme: SecuritySchemeSelection | null) => void;
}) => {
  const { selectedSchemes, credentials, setSelectedScheme, setCredential } =
    useSecurityState();

  const selectedScheme = selectedSchemes[operationId];
  const [editingScheme, setEditingScheme] = useState<string | null>(null);

  const handleSchemeChange = (schemeName: string) => {
    if (schemeName === NO_AUTH) {
      setSelectedScheme(operationId, null);
      onAuthChange?.(null);
      return;
    }

    const scheme = security.find((s) => s.name === schemeName);
    if (scheme) {
      const selection: SecuritySchemeSelection = {
        name: scheme.name,
        type: inferSchemeType(scheme.name),
        scopes: scheme.scopes,
        value: credentials[scheme.name],
      };
      setSelectedScheme(operationId, selection);
      onAuthChange?.(selection);
    }
  };

  const handleCredentialChange = (schemeName: string, value: string) => {
    setCredential(schemeName, value);
    const scheme = selectedSchemes[operationId];
    if (scheme && scheme.name === schemeName) {
      onAuthChange?.({ ...scheme, value });
    }
  };

  if (!security || security.length === 0) {
    return null;
  }

  return (
    <div className="w-full overflow-hidden">
      <RadioGroup
        onValueChange={handleSchemeChange}
        value={selectedScheme?.name ?? NO_AUTH}
        defaultValue={NO_AUTH}
        className="gap-0"
      >
        <Label className="h-10 items-center border-b font-normal flex gap-4 p-4 cursor-pointer hover:bg-accent/75">
          <RadioGroupItem value={NO_AUTH} id={NO_AUTH} />
          <span>None</span>
        </Label>

        {security.map((scheme) => {
          const schemeInfo = getSchemeInfo(scheme.name);
          const isEditing = editingScheme === scheme.name;
          const credentialValue = credentials[scheme.name];

          return (
            <div key={scheme.name} className="border-b">
              <Label className="h-10 items-center font-normal flex gap-4 p-4 cursor-pointer hover:bg-accent/75">
                <RadioGroupItem value={scheme.name} id={scheme.name} />
                <div className="flex-1 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-medium">{scheme.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {schemeInfo.displayName}
                      {scheme.scopes && scheme.scopes.length > 0 && (
                        <> • {scheme.scopes.length} scope(s)</>
                      )}
                    </span>
                  </div>
                  {selectedScheme?.name === scheme.name && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        setEditingScheme(isEditing ? null : scheme.name);
                      }}
                    >
                      <LockKeyholeIcon size={14} />
                      {credentialValue ? "Update" : "Configure"}
                    </Button>
                  )}
                </div>
              </Label>

              {selectedScheme?.name === scheme.name && isEditing && (
                <div className="p-4 bg-muted/50 space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor={`credential-${scheme.name}`}>
                      {schemeInfo.credentialLabel}
                    </Label>
                    <Input
                      id={`credential-${scheme.name}`}
                      type="password"
                      placeholder={schemeInfo.credentialPlaceholder}
                      value={credentialValue ?? ""}
                      onChange={(e) =>
                        handleCredentialChange(scheme.name, e.target.value)
                      }
                    />
                  </div>

                  {scheme.scopes && scheme.scopes.length > 0 && (
                    <div className="space-y-1">
                      <Label className="text-xs">Required Scopes:</Label>
                      <div className="flex flex-wrap gap-1">
                        {scheme.scopes.map((scope) => (
                          <span
                            key={scope}
                            className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground font-mono"
                          >
                            {scope}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
};
