import { useCallback, useMemo, useState } from "react";
import { Button } from "zudoku/ui/Button.js";
import { Callout } from "zudoku/ui/Callout.js";
import { Checkbox } from "zudoku/ui/Checkbox.js";
import { Input } from "zudoku/ui/Input.js";
import { Label } from "zudoku/ui/Label.js";
import type { SecuritySchemeData } from "./types.js";

export const ClientCredentialsSchemeForm = ({
  scheme,
  onAuthorize,
}: {
  scheme: Extract<SecuritySchemeData, { type: "oauth2" }>;
  onAuthorize: (value: string) => void;
}) => {
  const tokenEndpoint = scheme.flows?.clientCredentials?.tokenUrl ?? "";

  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [scopesSelected, setScopesSelected] = useState<string[]>([]);

  const toggleSelect = (id: string) => {
    const index = scopesSelected.indexOf(id);
    var nextSelected: string[];
    if (index < 0) {
      nextSelected = scopesSelected.concat(id);
    } else {
      nextSelected = [
        ...scopesSelected.slice(0, index),
        ...scopesSelected.slice(index + 1),
      ];
    }
    setScopesSelected(nextSelected);
  };

  const scopes = useMemo(() => {
    if (!scheme.flows?.clientCredentials?.scopes) {
      setError("Scopes invalid!");
      return [];
    } else {
      return scheme.flows.clientCredentials.scopes;
    }
  }, [scheme.flows?.clientCredentials?.scopes]);

  const obtainToken = useCallback(async () => {
    setError(undefined);

    const scopes = scopesSelected.join(" ");

    // send the OAuth Token Request
    const url = new URL(tokenEndpoint);
    await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
        scope: scopes,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          setError("Failed to fetch token");
          return;
        }

        response
          .json()
          .then((r) => {
            const accessToken = r.access_token;

            if (!accessToken) {
              setError("No access token found");
              return;
            }

            onAuthorize(accessToken);
          })
          .catch(() => {
            setError("Failed to read token response");
          });
      })
      .catch(() => {
        setError("Failed to fetch token");
      });
  }, [tokenEndpoint, clientId, clientSecret, scopesSelected, onAuthorize]);

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-xs text-muted-foreground">
        Token Endpoint ({tokenEndpoint})
      </Label>
      {error && (
        <Callout type="danger" title="Failed to obtain token">
          {error}
        </Callout>
      )}
      <Input
        key="clientId"
        placeholder="Enter client ID"
        value={clientId}
        onChange={(e) => setClientId(e.target.value)}
      />
      <Input
        key="clientSecret"
        type="password"
        placeholder="Enter client secret"
        value={clientSecret}
        onChange={(e) => setClientSecret(e.target.value)}
      />
      <div className="flex justify-between items-end gap-2">
        <div className="flex flex-col gap-3">
          <Label className="text-xs text-muted-foreground">Scopes</Label>
          {scopes.map(({ name, description }) => {
            return (
              <div className="flex items-center gap-2" key={name}>
                <Checkbox
                  id="name"
                  required
                  checked={scopesSelected.includes(name)}
                  onCheckedChange={() => toggleSelect(name)}
                />
                <Label htmlFor="name">
                  {name} {description ? `(${description})` : ""}
                </Label>
              </div>
            );
          })}
        </div>
        <Button
          size="lg"
          disabled={!clientId || !clientSecret}
          onClick={() => obtainToken()}
        >
          Authorize
        </Button>
      </div>
    </div>
  );
};
