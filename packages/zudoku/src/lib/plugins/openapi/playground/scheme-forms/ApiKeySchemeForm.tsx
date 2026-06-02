import { useState } from "react";
import { Button } from "zudoku/ui/Button.js";
import { Input } from "zudoku/ui/Input.js";
import { Label } from "zudoku/ui/Label.js";
import type { SecuritySchemeData } from "./types.js";

export const ApiKeySchemeForm = ({
  scheme,
  onAuthorize,
}: {
  scheme: Extract<SecuritySchemeData, { type: "apiKey" }>;
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
        <Button size="lg" disabled={!value} onClick={() => onAuthorize(value)}>
          Authorize
        </Button>
      </div>
    </div>
  );
};
