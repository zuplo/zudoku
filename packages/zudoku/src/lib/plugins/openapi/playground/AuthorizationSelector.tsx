import { EyeIcon, EyeOffIcon } from "lucide-react";
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
import ParamsGrid, { ParamsGridItem } from "./ParamsGrid.js";

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
  const [visibleSchemes, setVisibleSchemes] = useState<Set<string>>(new Set());

  const handleSchemeChange = (schemeName: string) => {
    const scheme = security.find((s) => s.name === schemeName);
    if (scheme) {
      const type = inferSchemeType(scheme.name);
      const selection: SecuritySchemeSelection = {
        name: scheme.name,
        type,
        scopes: scheme.scopes,
        value: credentials[scheme.name],
      };

      // Add apiKey metadata for API key auth types
      if (type === "apiKey") {
        const lowerName = scheme.name.toLowerCase();
        if (lowerName.includes("cookie")) {
          selection.apiKey = { in: "cookie", name: "session_id" };
        } else if (lowerName.includes("query") || lowerName.includes("param")) {
          selection.apiKey = { in: "query", name: "api_key" };
        } else {
          selection.apiKey = { in: "header", name: "X-API-Key" };
        }
      }

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

  const toggleVisibility = (schemeName: string) => {
    setVisibleSchemes((prev) => {
      const next = new Set(prev);
      if (next.has(schemeName)) {
        next.delete(schemeName);
      } else {
        next.add(schemeName);
      }
      return next;
    });
  };

  if (!security || security.length === 0) {
    return null;
  }

  return (
    <div className="w-full overflow-hidden">
      <RadioGroup
        onValueChange={handleSchemeChange}
        value={selectedScheme?.name}
        className="gap-0"
      >
        <ParamsGrid>
          {security.map((scheme) => {
            const schemeInfo = getSchemeInfo(scheme.name);
            const credentialValue = credentials[scheme.name];
            const isVisible = visibleSchemes.has(scheme.name);

            return (
              <ParamsGridItem key={scheme.name}>
                <RadioGroupItem value={scheme.name} id={scheme.name} />
                <Label
                  htmlFor={scheme.name}
                  className="cursor-pointer font-normal font-mono text-xs"
                >
                  {scheme.name}
                </Label>
                <div className="flex items-center gap-1 w-full">
                  <Input
                    type={isVisible ? "text" : "password"}
                    placeholder={schemeInfo.credentialPlaceholder}
                    value={credentialValue ?? ""}
                    onChange={(e) =>
                      handleCredentialChange(scheme.name, e.target.value)
                    }
                    className="w-full border-0 p-0 m-0 shadow-none text-xs focus-visible:ring-0"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => toggleVisibility(scheme.name)}
                    className="opacity-50 hover:opacity-100"
                  >
                    {isVisible ? (
                      <EyeOffIcon size={14} />
                    ) : (
                      <EyeIcon size={14} />
                    )}
                  </Button>
                </div>
              </ParamsGridItem>
            );
          })}
        </ParamsGrid>
      </RadioGroup>
    </div>
  );
};
