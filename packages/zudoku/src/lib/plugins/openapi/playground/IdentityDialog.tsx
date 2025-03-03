import { useState } from "react";
import { Button } from "zudoku/ui/Button.js";
import { Checkbox } from "zudoku/ui/Checkbox.js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "zudoku/ui/Dialog.js";
import { Label } from "zudoku/ui/Label.js";
import { type ApiIdentity } from "../../../core/ZudokuContext.js";
import IdentitySelector from "./IdentitySelector.js";

const IdentityDialog = ({
  onSubmit,
  identities,
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: ({
    rememberedIdentity,
    identity,
  }: {
    rememberedIdentity: boolean;
    identity?: string;
  }) => void;
  identities: ApiIdentity[];
}) => {
  const [identity, setIdentity] = useState<string | undefined>(undefined);
  const [rememberedIdentity, setRememberedIdentity] = useState<boolean>(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Select an auth identity</DialogTitle>
        <DialogDescription>
          Please select an identity for this request.
        </DialogDescription>
        <div className="max-h-80 overflow-auto">
          <IdentitySelector
            identities={identities}
            setValue={setIdentity}
            value={identity}
          />
        </div>
        <DialogFooter className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="remember"
              checked={rememberedIdentity}
              onCheckedChange={(checked) =>
                setRememberedIdentity(
                  checked === "indeterminate" ? false : !!checked,
                )
              }
            />
            <Label htmlFor="remember">Remember my choice</Label>
          </div>

          <Button
            onClick={() => onSubmit({ identity: identity, rememberedIdentity })}
          >
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { IdentityDialog };
