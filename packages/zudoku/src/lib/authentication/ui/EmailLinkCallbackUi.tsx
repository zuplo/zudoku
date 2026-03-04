import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Spinner } from "zudoku/components";
import { ActionButton } from "zudoku/ui/ActionButton.js";
import { Alert, AlertDescription, AlertTitle } from "zudoku/ui/Alert.js";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "zudoku/ui/Card.js";
import { Input } from "zudoku/ui/Input.js";
import { EMAIL_LINK_STORAGE_KEY } from "../constants.js";
import { getRelativeRedirectUrl } from "../utils/relativeRedirectUrl.js";
import { AuthCard } from "./AuthCard.js";

export const EmailLinkCallbackUi = ({
  onCompleteSignIn,
  isEmailLinkUrl,
}: {
  onCompleteSignIn: (email: string) => Promise<void>;
  isEmailLinkUrl: (url: string) => boolean;
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");
  const relativeRedirectTo = getRelativeRedirectUrl(redirectTo);

  const [emailInput, setEmailInput] = useState("");

  const signInMutation = useMutation({
    mutationFn: (email: string) => onCompleteSignIn(email),
    onSuccess: () => {
      localStorage.removeItem(EMAIL_LINK_STORAGE_KEY);
      void navigate(relativeRedirectTo, { replace: true });
    },
  });

  const [storedEmail] = useState(() =>
    localStorage.getItem(EMAIL_LINK_STORAGE_KEY),
  );

  const isValidLink = isEmailLinkUrl(window.location.href);

  const hasTriggered = useRef(false);
  useEffect(() => {
    if (isValidLink && storedEmail && !hasTriggered.current) {
      hasTriggered.current = true;
      signInMutation.mutate(storedEmail);
    }
  }, [isValidLink, storedEmail, signInMutation.mutate]);

  if (!isValidLink) {
    return (
      <AuthCard>
        <CardHeader className="text-center">
          <CardTitle>Invalid sign-in link</CardTitle>
          <CardDescription>
            This sign-in link is invalid or has expired. Please request a new
            one.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <a href="/signin/email-link" className="text-sm text-primary">
            Request a new sign-in link
          </a>
        </CardContent>
      </AuthCard>
    );
  }

  if (signInMutation.isPending || (storedEmail && signInMutation.isIdle)) {
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
