import { useMutation } from "@tanstack/react-query";
import React from "react";
import { Navigate, useSearchParams } from "react-router";
import { Spinner } from "zudoku/components";
import { ActionButton } from "zudoku/ui/ActionButton.js";
import { Alert, AlertDescription, AlertTitle } from "zudoku/ui/Alert.js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "zudoku/ui/Card.js";
import { Input } from "zudoku/ui/Input.js";
import createVariantComponent from "../../util/createVariantComponent.js";
import { getRelativeRedirectUrl } from "../utils/relativeRedirectUrl.js";

const EMAIL_LINK_STORAGE_KEY = "zudoku:emailForSignIn";

export const EmailLinkCallbackUi = ({
  onCompleteSignIn,
  isEmailLinkUrl,
}: {
  onCompleteSignIn: (email: string) => Promise<void>;
  isEmailLinkUrl: (url: string) => boolean;
}) => {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");
  const relativeRedirectTo = getRelativeRedirectUrl(redirectTo);

  const [emailInput, setEmailInput] = React.useState("");

  const signInMutation = useMutation({
    mutationFn: async (email: string) => {
      await onCompleteSignIn(email);
    },
  });

  const storedEmail = React.useMemo(
    () => localStorage.getItem(EMAIL_LINK_STORAGE_KEY),
    [],
  );

  const hasTriggered = React.useRef(false);
  React.useEffect(() => {
    if (storedEmail && !hasTriggered.current) {
      hasTriggered.current = true;
      signInMutation.mutate(storedEmail);
    }
  }, [storedEmail, signInMutation]);

  if (!isEmailLinkUrl(window.location.href)) {
    return <Navigate to="/signin" replace />;
  }

  if (signInMutation.isSuccess) {
    return <Navigate to={relativeRedirectTo} replace />;
  }

  if (
    storedEmail &&
    !signInMutation.isError &&
    (signInMutation.isPending || signInMutation.isIdle)
  ) {
    return (
      <AuthCard>
        <CardHeader className="text-center">
          <CardTitle>Signing you in...</CardTitle>
          <CardDescription>
            Please wait while we complete your sign-in.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          <Spinner />
        </CardContent>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <CardHeader>
        <CardTitle>Confirm your email</CardTitle>
        <CardDescription>
          Please enter the email address you used to request the sign-in link.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {signInMutation.error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{signInMutation.error.message}</AlertDescription>
          </Alert>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            signInMutation.mutate(emailInput);
          }}
          className="flex flex-col gap-2"
        >
          <Input
            placeholder="you@example.com"
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            required
          />
          <ActionButton type="submit" isPending={signInMutation.isPending}>
            Complete sign-in
          </ActionButton>
        </form>
      </CardContent>
    </AuthCard>
  );
};

const AuthCard = createVariantComponent(Card, "max-w-md w-full mt-10 mx-auto");
