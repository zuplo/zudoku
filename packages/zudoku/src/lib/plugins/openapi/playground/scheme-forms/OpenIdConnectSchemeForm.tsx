import { useMutation } from "@tanstack/react-query";
import { LoaderIcon } from "lucide-react";
import { useState } from "react";
import { useZudoku } from "zudoku/hooks";
import { Button } from "zudoku/ui/Button.js";
import { Input } from "zudoku/ui/Input.js";
import { Label } from "zudoku/ui/Label.js";
import type { SecuritySchemeData } from "./types.js";

export const OpenIdConnectSchemeForm = ({
  scheme,
  onAuthorize,
}: {
  scheme: Extract<SecuritySchemeData, { type: "openIdConnect" }>;
  onAuthorize: (value: string) => void;
}) => {
  const [token, setToken] = useState("");
  const [clientId, setClientId] = useState("");
  const { options } = useZudoku();

  const oidcMutation = useMutation({
    mutationFn: async () => {
      if (!scheme.openIdConnectUrl) {
        throw new Error("No OpenID Connect URL configured");
      }
      const { performOpenIdConnectFlow } =
        await import("../oauth/openIdConnect.js");
      return performOpenIdConnectFlow({
        openIdConnectUrl: scheme.openIdConnectUrl,
        clientId,
        basePath: options.basePath,
      });
    },
    onSuccess: (result) => onAuthorize(result.access_token),
  });

  return (
    <div className="flex flex-col gap-2">
      {scheme.openIdConnectUrl && (
        <div className="text-xs text-muted-foreground break-all">
          Discovery: {scheme.openIdConnectUrl}
        </div>
      )}
      {scheme.openIdConnectUrl && (
        <div className="flex flex-col gap-2">
          <Input
            placeholder="Client ID"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          />
          <Button
            size="lg"
            variant="outline"
            disabled={!clientId || oidcMutation.isPending}
            onClick={() => oidcMutation.mutate()}
          >
            {oidcMutation.isPending && (
              <LoaderIcon size={14} className="animate-spin" />
            )}
            Authorize via OpenID Connect
          </Button>
        </div>
      )}
      {oidcMutation.error && (
        <p className="text-xs text-destructive">
          {oidcMutation.error instanceof Error
            ? oidcMutation.error.message
            : "OIDC flow failed"}
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
