import { useState } from "react";
import { Button } from "zudoku/ui/Button.js";
import { Input } from "zudoku/ui/Input.js";
import { Label } from "zudoku/ui/Label.js";
import type { BasicCredentials } from "../securityCredentialsStore.js";

export const HttpBasicSchemeForm = ({
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
          size="lg"
          disabled={!username}
          onClick={() => onAuthorize({ username, password })}
        >
          Authorize
        </Button>
      </div>
    </div>
  );
};
