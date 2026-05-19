import { useMutation } from "@tanstack/react-query";
import { Mail, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Link, Navigate } from "react-router";
import { Alert, AlertDescription, AlertTitle } from "zudoku/ui/Alert.js";
import { Button } from "zudoku/ui/Button.js";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "zudoku/ui/Card.js";
import { useTranslation } from "../../components/context/useTranslation.js";
import { cn } from "../../util/cn.js";
import { EMAIL_LINK_STORAGE_KEY } from "../constants.js";
import { AuthCard } from "./AuthCard.js";

export const EmailLinkSentUi = ({
  onResendEmailLink,
}: {
  onResendEmailLink: () => Promise<void>;
}) => {
  const { t } = useTranslation();
  const [email] = useState(() => localStorage.getItem(EMAIL_LINK_STORAGE_KEY));

  const resendMutation = useMutation({
    mutationFn: () => onResendEmailLink(),
  });

  if (!email) {
    return <Navigate to="/signin/email-link" replace />;
  }

  return (
    <AuthCard>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <CardTitle>{t("auth.checkYourEmail")}</CardTitle>
        <CardDescription>
          {t("auth.emailLinkSentTo", { email: email ?? "" })}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {resendMutation.error && (
          <Alert variant="destructive">
            <AlertTitle>{t("auth.error")}</AlertTitle>
            <AlertDescription>{resendMutation.error.message}</AlertDescription>
          </Alert>
        )}

        {resendMutation.isSuccess && (
          <Alert>
            <AlertTitle>{t("auth.emailSent")}</AlertTitle>
            <AlertDescription>{t("auth.emailLinkResent")}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-card px-2 text-muted-foreground">
                {t("auth.didntReceiveEmail")}
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => void resendMutation.mutate()}
            disabled={resendMutation.isPending}
            className="w-full gap-2"
          >
            <RefreshCw
              className={cn(
                "h-4 w-4",
                resendMutation.isPending && "animate-spin",
              )}
            />
            {t("auth.resendEmailLink")}
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          {t("auth.checkSpamFolder")}
        </p>

        <Link
          to="/signin"
          className="text-sm text-muted-foreground text-center"
        >
          {t("auth.backToSignIn")}
        </Link>
      </CardContent>
    </AuthCard>
  );
};
