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
  DialogTrigger,
} from "zudoku/ui/Dialog.js";
import { Input } from "zudoku/ui/Input.js";
import { Label } from "zudoku/ui/Label.js";
import { Separator } from "zudoku/ui/Separator.js";
import type {
  SecuritySchemeIn,
  SecuritySchemeType,
} from "../graphql/graphql.js";
import type { BasicCredentials } from "./securityCredentialsStore.js";
import { useSecurityCredentialsStore } from "./securityCredentialsStore.js";

type OAuthScopeData = { name: string; description: string };
type OAuthFlowData = {
  authorizationUrl?: string | null;
  tokenUrl?: string | null;
  refreshUrl?: string | null;
  scopes: OAuthScopeData[];
};

type SecuritySchemeData = {
  name: string;
  type: SecuritySchemeType;
  description?: string | null;
  in?: SecuritySchemeIn | null;
  paramName?: string | null;
  scheme?: string | null;
  bearerFormat?: string | null;
  openIdConnectUrl?: string | null;
  flows?: {
    implicit?: OAuthFlowData | null;
    password?: OAuthFlowData | null;
    clientCredentials?: OAuthFlowData | null;
    authorizationCode?: OAuthFlowData | null;
  } | null;
};

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

const ApiKeySchemeForm = ({
  scheme,
  onAuthorize,
}: {
  scheme: SecuritySchemeData;
  onAuthorize: (value: string) => void;
}) => {
  const [value, setValue] = useState("");
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-xs text-muted-foreground">
        {scheme.paramName ?? "API Key"} ({scheme.in ?? "header"})
      </Label>
      <div className="flex gap-2">
        <Input
          type="password"
          placeholder={`Enter ${scheme.paramName ?? "API key"}`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1"
        />
        <Button size="sm" disabled={!value} onClick={() => onAuthorize(value)}>
          Authorize
        </Button>
      </div>
    </div>
  );
};

const HttpBasicSchemeForm = ({
  onAuthorize,
}: {
  onAuthorize: (value: BasicCredentials) => void;
}) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-xs text-muted-foreground">HTTP Basic</Label>
      <Input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <div className="flex gap-2">
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="flex-1"
        />
        <Button
          size="sm"
          disabled={!username}
          onClick={() => onAuthorize({ username, password })}
        >
          Authorize
        </Button>
      </div>
    </div>
  );
};

const HttpBearerSchemeForm = ({
  scheme,
  onAuthorize,
}: {
  scheme: SecuritySchemeData;
  onAuthorize: (value: string) => void;
}) => {
  const [value, setValue] = useState("");
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-xs text-muted-foreground">
        Bearer{scheme.bearerFormat ? ` (${scheme.bearerFormat})` : ""}
      </Label>
      <div className="flex gap-2">
        <Input
          type="password"
          placeholder="Enter bearer token"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1"
        />
        <Button size="sm" disabled={!value} onClick={() => onAuthorize(value)}>
          Authorize
        </Button>
      </div>
    </div>
  );
};

const OAuth2SchemeForm = ({
  scheme,
  onAuthorize,
}: {
  scheme: SecuritySchemeData;
  onAuthorize: (value: string) => void;
}) => {
  const [token, setToken] = useState("");
  const flows = scheme.flows;

  const allScopes = new Map<string, string>();
  for (const flow of [
    flows?.implicit,
    flows?.password,
    flows?.clientCredentials,
    flows?.authorizationCode,
  ]) {
    if (flow?.scopes) {
      for (const scope of flow.scopes) {
        allScopes.set(scope.name, scope.description);
      }
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {allScopes.size > 0 && (
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">
            Available scopes
          </Label>
          <div className="flex flex-wrap gap-1">
            {Array.from(allScopes.entries()).map(([name, desc]) => (
              <code
                key={name}
                className="text-[10px] bg-muted px-1.5 py-0.5 rounded"
                title={desc}
              >
                {name}
              </code>
            ))}
          </div>
        </div>
      )}
      <Label className="text-xs text-muted-foreground">Access Token</Label>
      <div className="flex gap-2">
        <Input
          type="password"
          placeholder="Enter access token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="flex-1"
        />
        <Button size="sm" disabled={!token} onClick={() => onAuthorize(token)}>
          Authorize
        </Button>
      </div>
    </div>
  );
};

const OpenIdConnectSchemeForm = ({
  scheme,
  onAuthorize,
}: {
  scheme: SecuritySchemeData;
  onAuthorize: (value: string) => void;
}) => {
  const [token, setToken] = useState("");
  return (
    <div className="flex flex-col gap-2">
      {scheme.openIdConnectUrl && (
        <div className="text-xs text-muted-foreground break-all">
          Discovery: {scheme.openIdConnectUrl}
        </div>
      )}
      <Label className="text-xs text-muted-foreground">Access Token</Label>
      <div className="flex gap-2">
        <Input
          type="password"
          placeholder="Enter access token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="flex-1"
        />
        <Button size="sm" disabled={!token} onClick={() => onAuthorize(token)}>
          Authorize
        </Button>
      </div>
    </div>
  );
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
            <CheckCircle2Icon size={14} className="text-green-500" />
            <span className="text-xs text-green-600 dark:text-green-400">
              Authorized
            </span>
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
          {scheme.type === "apiKey" && (
            <ApiKeySchemeForm
              scheme={scheme}
              onAuthorize={(value) => setCredential(scheme.name, value)}
            />
          )}
          {scheme.type === "http" && scheme.scheme === "basic" && (
            <HttpBasicSchemeForm
              onAuthorize={(value) => setCredential(scheme.name, value)}
            />
          )}
          {scheme.type === "http" && scheme.scheme !== "basic" && (
            <HttpBearerSchemeForm
              scheme={scheme}
              onAuthorize={(value) => setCredential(scheme.name, value)}
            />
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
  children,
}: {
  securitySchemes: SecuritySchemeData[];
  children?: React.ReactNode;
}) => {
  const { credentials, clearAll } = useSecurityCredentialsStore();
  const authorizedCount = Object.values(credentials).filter(
    (c) => c.isAuthorized,
  ).length;

  if (securitySchemes.length === 0) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children ?? (
          <Button variant="outline" size="sm" className="gap-1.5">
            <LockIcon size={14} />
            Authorize
            {authorizedCount > 0 && (
              <span className="text-xs bg-green-500/20 text-green-600 dark:text-green-400 px-1.5 rounded-full">
                {authorizedCount}
              </span>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
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
        {authorizedCount > 0 && (
          <>
            <Separator />
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={clearAll}>
                <LogOutIcon size={14} />
                Clear All
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
