import {
  KeyRoundIcon,
  LockIcon,
  LogOutIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { Button } from "zudoku/ui/Button.js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "zudoku/ui/Dialog.js";
import type { SecuritySchemeType } from "../graphql/graphql.js";
import { ApiKeySchemeForm } from "./scheme-forms/ApiKeySchemeForm.js";
import { HttpBasicSchemeForm } from "./scheme-forms/HttpBasicSchemeForm.js";
import { HttpBearerSchemeForm } from "./scheme-forms/HttpBearerSchemeForm.js";
import { OAuth2SchemeForm } from "./scheme-forms/OAuth2SchemeForm.js";
import { OpenIdConnectSchemeForm } from "./scheme-forms/OpenIdConnectSchemeForm.js";
import type { SecuritySchemeData } from "./scheme-forms/types.js";
import { useSecurityCredentialsStore } from "./securityCredentialsStore.js";

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

const SchemeEntry = ({ scheme }: { scheme: SecuritySchemeData }) => {
  const { credentials, setCredential, clearCredential } =
    useSecurityCredentialsStore();
  const isAuthorized = credentials[scheme.name]?.isAuthorized ?? false;

  return (
    <div className="flex flex-col gap-3 p-4 border rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {schemeIcon(scheme.type)}
          <span className="font-medium text-sm">{scheme.name}</span>
          <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
            {scheme.type}
          </code>
        </div>
        {isAuthorized && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Configured</span>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => clearCredential(scheme.name)}
              title="Remove authorization"
            >
              <LogOutIcon size={14} />
            </Button>
          </div>
        )}
      </div>
      {scheme.description && (
        <p className="text-xs text-muted-foreground">{scheme.description}</p>
      )}
      {!isAuthorized && (
        <>
          {scheme.type === "apiKey" && scheme.in !== "cookie" && (
            <ApiKeySchemeForm
              scheme={scheme}
              onAuthorize={(value) => setCredential(scheme.name, value)}
            />
          )}
          {scheme.type === "apiKey" && scheme.in === "cookie" && (
            <p className="text-xs text-muted-foreground italic">
              Cookie-based API key authentication is not supported in the
              browser playground due to fetch API restrictions.
            </p>
          )}
          {scheme.type === "http" && scheme.scheme === "basic" && (
            <HttpBasicSchemeForm
              onAuthorize={(value) => setCredential(scheme.name, value)}
            />
          )}
          {scheme.type === "http" && scheme.scheme === "bearer" && (
            <HttpBearerSchemeForm
              scheme={scheme}
              onAuthorize={(value) => setCredential(scheme.name, value)}
            />
          )}
          {scheme.type === "http" &&
            scheme.scheme !== "basic" &&
            scheme.scheme !== "bearer" && (
              <p className="text-xs text-muted-foreground italic">
                HTTP {scheme.scheme} authentication is not supported in the
                playground. Configure it via custom headers.
              </p>
            )}
          {scheme.type === "oauth2" && (
            <OAuth2SchemeForm
              scheme={scheme}
              onAuthorize={(value) => setCredential(scheme.name, value)}
            />
          )}
          {scheme.type === "openIdConnect" && (
            <OpenIdConnectSchemeForm
              scheme={scheme}
              onAuthorize={(value) => setCredential(scheme.name, value)}
            />
          )}
          {scheme.type === "mutualTLS" && (
            <p className="text-xs text-muted-foreground italic">
              Mutual TLS is configured at the transport level.
            </p>
          )}
        </>
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
          {securitySchemes.map((scheme) => (
            <SchemeEntry key={scheme.name} scheme={scheme} />
          ))}
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
