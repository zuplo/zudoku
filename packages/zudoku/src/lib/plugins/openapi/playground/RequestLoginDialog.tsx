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
import { useTranslation } from "../../../i18n/I18nContext.js";

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
  const { t } = useTranslation();
  const [rememberSkip, setRememberSkip] = useState(false);

  const handleSkip = () => {
    onSkip?.(rememberSkip);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogTitle>{t("openapi.playground.login.title")}</DialogTitle>
        <DialogDescription>
          {t("openapi.playground.login.description")}
        </DialogDescription>
        <Label className="flex items-center gap-2 font-normal">
          <Checkbox
            checked={rememberSkip}
            onCheckedChange={(checked) => setRememberSkip(checked === true)}
          />
          {t("openapi.playground.login.dontShowAgain")}
        </Label>
        <DialogFooter className="flex gap-2 sm:justify-between">
          <Button type="button" variant="outline" onClick={handleSkip}>
            {t("openapi.playground.login.skip")}
          </Button>
          <div className="flex gap-2">
            {onSignUp && (
              <Button type="button" variant="outline" onClick={onSignUp}>
                {t("openapi.playground.login.signUp")}
              </Button>
            )}
            {onLogin && (
              <Button type="button" variant="default" onClick={onLogin}>
                {t("openapi.playground.login.login")}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RequestLoginDialog;
