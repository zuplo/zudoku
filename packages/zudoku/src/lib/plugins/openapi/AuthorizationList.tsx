import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useEffect } from "react";
import { Heading } from "../../components/Heading.js";
import { Card } from "../../ui/Card.js";
import { Label } from "../../ui/Label.js";
import { RadioGroup, RadioGroupItem } from "../../ui/RadioGroup.js";
import { AuthorizationListItem } from "./AuthorizationListItem.js";
import type { SecurityRequirement } from "./graphql/graphql.js";
import {
  type SecuritySchemeSelection,
  useSecurityState,
} from "./state/securityState.js";
import { inferSchemeType } from "./util/authHelpers.js";

const NO_AUTH = "__none";

export const AuthorizationList = ({
  summary,
  security,
  id,
}: {
  summary?: string;
  security: SecurityRequirement[];
  id: string;
}) => {
  const { selectedSchemes, setSelectedScheme, credentials } =
    useSecurityState();
  const currentSelection = selectedSchemes[id];

  // Auto-select first security option by default if none selected
  useEffect(() => {
    if (!currentSelection && security.length > 0) {
      // biome-ignore lint/style/noNonNullAssertion: security.length > 0 guarantees security[0] exists
      const firstScheme = security[0]!;
      const selection: SecuritySchemeSelection = {
        name: firstScheme.name,
        type: inferSchemeType(firstScheme.name),
        scopes: firstScheme.scopes,
        value: credentials[firstScheme.name],
      };
      setSelectedScheme(id, selection);
    }
  }, [currentSelection, security, id, setSelectedScheme, credentials]);

  const handleSchemeChange = (schemeName: string) => {
    if (schemeName === NO_AUTH) {
      setSelectedScheme(id, null);
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
      setSelectedScheme(id, selection);
    }
  };

  if (!security || security.length === 0) {
    return null;
  }

  return (
    <>
      <Heading level={3} id={`${id}/authorization`}>
        {summary && <VisuallyHidden>{summary} &rsaquo; </VisuallyHidden>}
        Authorization
      </Heading>
      <Card>
        <RadioGroup
          onValueChange={handleSchemeChange}
          value={currentSelection?.name ?? security[0]!.name}
          className="gap-0 rounded-md overflow-hidden"
        >
          {security.map((requirement, index) => (
            <div key={`${requirement.name}-${index}`}>
              <Label
                className={`h-10 items-center font-normal flex gap-4 p-4 cursor-pointer hover:bg-accent/75 ${
                  index < security.length - 1 ? "border-b" : ""
                }`}
              >
                <RadioGroupItem
                  value={requirement.name}
                  id={`${id}-${requirement.name}`}
                />
                <AuthorizationListItem requirement={requirement} />
              </Label>
            </div>
          ))}
        </RadioGroup>
      </Card>
    </>
  );
};
