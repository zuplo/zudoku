import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckIcon, MailCheck, RefreshCw } from "lucide-react";
import { Navigate, useSearchParams } from "react-router";
import { ActionButton } from "zudoku/ui/ActionButton.js";
import { Alert, AlertDescription, AlertTitle } from "zudoku/ui/Alert.js";
import { Button } from "zudoku/ui/Button.js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "zudoku/ui/Card.js";
import createVariantComponent from "../../util/createVariantComponent.js";
import { getRelativeRedirectUrl } from "../utils/relativeRedirectUrl.js";

export const EmailVerificationUi = ({
  onResendVerification,
  onCheckVerification,
}: {
  onResendVerification: () => Promise<void>;
  onCheckVerification: () => Promise<boolean>;
}) => {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");
  const relativeRedirectTo = getRelativeRedirectUrl(redirectTo);

  const resendMutation = useMutation({
    mutationFn: async () => {
      await onResendVerification();
    },
  });

  const checkVerificationMutation = useQuery({
    queryKey: ["check-verification"],
    queryFn: async () => {
      const isVerified = await onCheckVerification();
      return isVerified;
    },
  });

  const error = resendMutation.error ?? checkVerificationMutation.error ?? null;

  return (
    <AuthCard>
      {checkVerificationMutation.data === true && (
        <Navigate to={relativeRedirectTo} />
      )}
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <MailCheck className="h-8 w-8 text-primary" />
        </div>
        <CardTitle>Verify your email</CardTitle>
        <CardDescription>We've sent a verification link</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error?.message}</AlertDescription>
          </Alert>
        )}

        {resendMutation.isSuccess && (
          <Alert>
            <AlertTitle>Email sent</AlertTitle>
            <AlertDescription>
              A new verification email has been sent. Please check your inbox.
            </AlertDescription>
          </Alert>
        )}

        {checkVerificationMutation.isSuccess &&
          !checkVerificationMutation.data && (
            <Alert>
              <AlertDescription>
                {checkVerificationMutation.isFetching
                  ? "Checking verification..."
                  : "Your email hasn't been verified yet. Please check your inbox and click the verification link."}
              </AlertDescription>
            </Alert>
          )}

        <div className="space-y-4">
          <ActionButton
            onClick={() => void checkVerificationMutation.refetch()}
            isPending={checkVerificationMutation.isFetching}
            className="w-full"
          >
            <div className="flex items-center gap-2">
              <CheckIcon className="h-4 w-4" /> Continue
            </div>
          </ActionButton>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-card px-2 text-muted-foreground">
                Didn't receive the email?
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => void resendMutation.mutate()}
            disabled={resendMutation.isPending}
            className="w-full gap-2"
          >
            {resendMutation.isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Resend verification email
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Make sure to check your spam folder if you don't see the email.
        </p>
      </CardContent>
    </AuthCard>
  );
};

const AuthCard = createVariantComponent(Card, "max-w-md w-full mt-10 mx-auto");
