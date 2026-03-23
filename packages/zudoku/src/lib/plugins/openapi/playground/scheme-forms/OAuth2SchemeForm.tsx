import { useMutation } from "@tanstack/react-query";
import { LoaderIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "zudoku/ui/Button.js";
import { Input } from "zudoku/ui/Input.js";
import { Label } from "zudoku/ui/Label.js";
import type { SecuritySchemeData } from "./types.js";

export const OAuth2SchemeForm = ({
  scheme,
  onAuthorize,
}: {
  scheme: Extract<SecuritySchemeData, { type: "oauth2" }>;
  onAuthorize: (value: string) => void;
}) => {
  const [token, setToken] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const flows = scheme.flows;
  const hasClientCredentials = !!flows?.clientCredentials?.tokenUrl;
  const hasAuthorizationCode =
    !!flows?.authorizationCode?.tokenUrl &&
    !!flows?.authorizationCode?.authorizationUrl;

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

  const clientCredentialsMutation = useMutation({
    mutationFn: async () => {
      if (!flows?.clientCredentials?.tokenUrl) {
        throw new Error("No token URL configured");
      }
      const { fetchClientCredentialsToken } =
        await import("../oauth/clientCredentials.js");
      return fetchClientCredentialsToken({
        tokenUrl: flows.clientCredentials.tokenUrl,
        clientId,
        clientSecret,
        scopes: flows.clientCredentials.scopes.map((s) => s.name),
      });
    },
    onSuccess: (result) => onAuthorize(result.access_token),
  });

  const authorizationCodeMutation = useMutation({
    mutationFn: async () => {
      if (
        !flows?.authorizationCode?.authorizationUrl ||
        !flows?.authorizationCode?.tokenUrl
      ) {
        throw new Error("No authorization URL configured");
      }
      const { performAuthorizationCodeFlow } =
        await import("../oauth/authorizationCode.js");
      return performAuthorizationCodeFlow({
        authorizationUrl: flows.authorizationCode.authorizationUrl,
        tokenUrl: flows.authorizationCode.tokenUrl,
        clientId,
        scopes: flows.authorizationCode.scopes.map((s) => s.name),
      });
    },
    onSuccess: (result) => onAuthorize(result.access_token),
  });

  const loading =
    clientCredentialsMutation.isPending || authorizationCodeMutation.isPending;
  const error =
    clientCredentialsMutation.error ?? authorizationCodeMutation.error;

  return (
    <div className="flex flex-col gap-3">
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

      {(hasClientCredentials || hasAuthorizationCode) && (
        <div className="flex flex-col gap-2">
          <Input
            placeholder="Client ID"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          />
          {hasClientCredentials && (
            <Input
              type="password"
              placeholder="Client Secret"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
            />
          )}
          <div className="flex gap-2">
            {hasClientCredentials && (
              <Button
                size="lg"
                variant="outline"
                disabled={!clientId || !clientSecret || loading}
                onClick={() => clientCredentialsMutation.mutate()}
              >
                {clientCredentialsMutation.isPending && (
                  <LoaderIcon size={14} className="animate-spin" />
                )}
                Client Credentials
              </Button>
            )}
            {hasAuthorizationCode && (
              <Button
                size="lg"
                variant="outline"
                disabled={!clientId || loading}
                onClick={() => authorizationCodeMutation.mutate()}
              >
                {authorizationCodeMutation.isPending && (
                  <LoaderIcon size={14} className="animate-spin" />
                )}
                Authorization Code
              </Button>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive">
          {error instanceof Error ? error.message : "Token request failed"}
        </p>
      )}

      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">
          Or enter a token directly
        </Label>
        <div className="flex gap-2">
          <Input
            type="password"
            placeholder="Enter access token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="flex-1"
          />
          <Button
            size="lg"
            disabled={!token}
            onClick={() => onAuthorize(token)}
          >
            Authorize
          </Button>
        </div>
      </div>
    </div>
  );
};
