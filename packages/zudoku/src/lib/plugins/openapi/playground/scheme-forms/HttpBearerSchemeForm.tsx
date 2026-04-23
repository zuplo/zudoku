import { useState } from "react";
import { Button } from "zudoku/ui/Button.js";
import { Input } from "zudoku/ui/Input.js";
import { Label } from "zudoku/ui/Label.js";
import type { SecuritySchemeData } from "./types.js";

export const HttpBearerSchemeForm = ({
  scheme,
  onAuthorize,
}: {
  scheme: Extract<SecuritySchemeData, { type: "http" }>;
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
        <Button size="lg" disabled={!value} onClick={() => onAuthorize(value)}>
          Authorize
        </Button>
      </div>
    </div>
  );
};
