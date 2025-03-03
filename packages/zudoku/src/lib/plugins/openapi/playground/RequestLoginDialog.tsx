import { Button } from "zudoku/ui/Button.js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "zudoku/ui/Dialog.js";

const RequestLoginDialog = ({
  open,
  setOpen,
  onSignUp,
  onLogin,
}: {
  open: boolean;
  onSignUp?: () => void;
  onLogin?: () => void;
  setOpen: (open: boolean) => void;
}) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogTitle>Welcome to the Playground!</DialogTitle>
        <DialogDescription>
          The Playground is a tool for developers to test and explore our APIs.
          To use the Playground, you need to login.
        </DialogDescription>
        <DialogFooter className="flex gap-2 sm:justify-between">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
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
