import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useEffect } from "react";
import { Heading } from "../../components/Heading.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/Select.js";
import { AuthorizationListItem } from "./AuthorizationListItem.js";
import type { SecurityRequirement } from "./graphql/graphql.js";
import {
  type SecuritySchemeSelection,
  useSecurityState,
} from "./state/securityState.js";
import { addApiKeyMetadata, inferSchemeType } from "./util/authHelpers.js";

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

  useEffect(() => {
    if (!currentSelection && security.length > 0) {
      // biome-ignore lint/style/noNonNullAssertion: security.length > 0 guarantees security[0] exists
      const firstScheme = security[0]!;
      const type = inferSchemeType(firstScheme.name);
      const selection: SecuritySchemeSelection = {
        name: firstScheme.name,
        type,
        scopes: firstScheme.scopes,
        value: credentials[firstScheme.name],
      };

      addApiKeyMetadata(selection, firstScheme.name);
      setSelectedScheme(id, selection);
    }
  }, [currentSelection, security, id, setSelectedScheme, credentials]);

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

      addApiKeyMetadata(selection, scheme.name);
      setSelectedScheme(id, selection);
    }
  };

  if (!security || security.length === 0) {
    return null;
  }

  return (
    <div className="my-4 flex flex-col gap-4">
      <Heading level={3} id={`${id}/authorization`}>
        {summary && <VisuallyHidden>{summary} &rsaquo; </VisuallyHidden>}
        Authorization
      </Heading>
      <Select
        onValueChange={handleSchemeChange}
        value={currentSelection?.name ?? security[0]?.name}
      >
        <SelectTrigger className="h-auto min-h-10 py-2">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {security.map((requirement, index) => (
            <SelectItem
              key={`${requirement.name}-${index}`}
              value={requirement.name}
              className="h-auto py-2"
            >
              <AuthorizationListItem requirement={requirement} />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
