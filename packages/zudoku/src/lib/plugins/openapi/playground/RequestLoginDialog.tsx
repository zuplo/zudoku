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

const RequestLoginDialog = ({
  open,
  setOpen,
  onSignUp,
  onLogin,
  onSkip,
}: {
  open: boolean;
  onSignUp?: () => void;
  onLogin?: () => void;
  setOpen: (open: boolean) => void;
  onSkip?: (rememberSkip: boolean) => void;
}) => {
  const [rememberSkip, setRememberSkip] = useState(false);

  const handleSkip = () => {
    onSkip?.(rememberSkip);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogTitle>Welcome to the Playground!</DialogTitle>
        <DialogDescription>
          The Playground is a tool for developers to test and explore our APIs.
          To use the Playground, you need to login.
        </DialogDescription>
        <Label className="flex items-center gap-2 font-normal">
          <Checkbox
            checked={rememberSkip}
            onCheckedChange={(checked) => setRememberSkip(checked === true)}
          />
          Don't show this again
        </Label>
        <DialogFooter className="flex gap-2 sm:justify-between">
          <Button type="button" variant="outline" onClick={handleSkip}>
            Skip
          </Button>
          <div className="flex gap-2">
            {onSignUp && (
              <Button type="button" variant="outline" onClick={onSignUp}>
                Sign Up
              </Button>
            )}
            {onLogin && (
              <Button type="button" variant="default" onClick={onLogin}>
                Login
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RequestLoginDialog;
