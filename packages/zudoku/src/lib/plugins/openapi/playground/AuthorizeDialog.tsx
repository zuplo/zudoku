import {
  CheckCircle2Icon,
  KeyRoundIcon,
  LockIcon,
  LogOutIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { useState } from "react";
import { Button } from "zudoku/ui/Button.js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "zudoku/ui/Dialog.js";
import { Markdown } from "../../../components/Markdown.js";
import { securitySchemeNamesLabel } from "../../../hooks/useIdentityStore.js";
import type { SecuritySchemeType } from "../graphql/graphql.js";
import {
  isCredentialComplete,
  SchemeCredentialField,
} from "./scheme-forms/SchemeCredentialField.js";
import type { SecuritySchemeData } from "./scheme-forms/types.js";
import {
  areSchemesAuthorized,
  type SecurityCredentialValue,
  useSecurityCredentialsStore,
} from "./securityCredentialsStore.js";

const schemeIcon = (type: SecuritySchemeType) => {
  switch (type) {
    case "apiKey":
      return <KeyRoundIcon size={16} />;
    case "http":
      return <LockIcon size={16} />;
    case "oauth2":
    case "openIdConnect":
      return <ShieldCheckIcon size={16} />;
    default:
      return <LockIcon size={16} />;
  }
};

const CredentialsEntry = ({ schemes }: { schemes: SecuritySchemeData[] }) => {
  const { credentials, setCredential, clearCredential } =
    useSecurityCredentialsStore();
  const [values, setValues] = useState<Record<string, SecurityCredentialValue>>(
    {},
  );

  const schemeNames = schemes.map((scheme) => scheme.name);
  const isAuthorized = areSchemesAuthorized(schemeNames, credentials);
  const pendingSchemes = schemes.filter(
    (scheme) => !credentials[scheme.name]?.isAuthorized,
  );
  const canAuthorize = pendingSchemes.every((scheme) =>
    isCredentialComplete(scheme, values[scheme.name]),
  );

  const authorize = () => {
    for (const scheme of pendingSchemes) {
      const value = values[scheme.name];
      if (value !== undefined) {
        setCredential(scheme.name, value);
      }
    }
  };

  const [firstScheme] = schemes;
  if (!firstScheme) {
    return null;
  }
  const isGrouped = schemes.length > 1;
  const authorizeButton = (
    <Button size="lg" disabled={!canAuthorize} onClick={authorize}>
      Authorize
    </Button>
  );

  return (
    <div className="flex flex-col gap-3 p-4 border rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {schemeIcon(firstScheme.type)}
          <span className="font-medium text-sm">
            {securitySchemeNamesLabel(schemeNames)}
          </span>
          {!isGrouped && (
            <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
              {firstScheme.type}
            </code>
          )}
        </div>
        {isAuthorized && (
          <div className="flex items-center gap-2">
            <CheckCircle2Icon size={14} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Configured</span>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => {
                for (const name of schemeNames) {
                  clearCredential(name);
                }
              }}
              title="Remove authorization"
            >
              <LogOutIcon size={14} />
            </Button>
          </div>
        )}
      </div>
      {schemes.map((scheme) => {
        const isSchemeAuthorized = credentials[scheme.name]?.isAuthorized;
        return (
          <div key={scheme.name} className="flex flex-col gap-2">
            {isGrouped && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">{scheme.name}</span>
                {!isAuthorized && isSchemeAuthorized && (
                  <span className="text-xs text-muted-foreground">
                    Configured
                  </span>
                )}
              </div>
            )}
            {scheme.description && (
              <Markdown
                content={scheme.description}
                className="prose-xs text-xs text-muted-foreground max-w-full"
              />
            )}
            {!isSchemeAuthorized && (
              <SchemeCredentialField
                scheme={scheme}
                value={values[scheme.name]}
                onChange={(value) =>
                  setValues((previous) => ({
                    ...previous,
                    [scheme.name]: value,
                  }))
                }
              >
                {!isGrouped && authorizeButton}
              </SchemeCredentialField>
            )}
          </div>
        );
      })}
      {isGrouped && !isAuthorized && (
        <div className="flex justify-end">{authorizeButton}</div>
      )}
    </div>
  );
};

export const AuthorizeDialog = ({
  securitySchemes,
  open,
  onOpenChange,
}: {
  securitySchemes: SecuritySchemeData[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  if (securitySchemes.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-lg max-h-[80vh] overflow-y-auto"
        showCloseButton
      >
        <DialogTitle>Authorize</DialogTitle>
        <DialogDescription>
          Configure authentication for API requests. Credentials are stored in
          session storage and cleared when you close the browser tab.
        </DialogDescription>
        <div className="flex flex-col gap-3">
          <CredentialsEntry schemes={securitySchemes} />
        </div>
        <div className="flex justify-end">
          <Button size="lg" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
