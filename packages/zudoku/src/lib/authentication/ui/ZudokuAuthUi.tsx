import { useMutation } from "@tanstack/react-query";
import React from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router";
import { ActionButton } from "zudoku/ui/ActionButton.js";
import { Alert, AlertDescription, AlertTitle } from "zudoku/ui/Alert.js";
import { Button, type ButtonProps } from "zudoku/ui/Button.js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "zudoku/ui/Card.js";
import { Input } from "zudoku/ui/Input.js";
import { Separator } from "zudoku/ui/Separator.js";
import {
  Form,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../ui/Form.js";
import { cn } from "../../util/cn.js";
import createVariantComponent from "../../util/createVariantComponent.js";
import { getRelativeRedirectUrl } from "../utils/relativeRedirectUrl.js";
import AppleIcon from "./icons/Apple.js";
import FacebookIcon from "./icons/Facebook.js";
import GithubIcon from "./icons/Github.js";
import GoogleIcon from "./icons/Google.js";
import MicrosoftIcon from "./icons/Microsoft.js";
import XIcon from "./icons/X.js";

export const AUTH_PROVIDER_NAMES: Record<AuthProviderId, string> = {
  google: "Google",
  github: "GitHub",
  facebook: "Facebook",
  twitter: "X",
  x: "X",
  microsoft: "Microsoft",
  apple: "Apple",
  yahoo: "Yahoo",
};

export type AuthProviderId = keyof typeof ProviderIcons;

const ProviderIcons = {
  google: GoogleIcon,
  github: GithubIcon,
  facebook: FacebookIcon,
  twitter: XIcon,
  x: XIcon,
  apple: AppleIcon,
  microsoft: MicrosoftIcon,
  yahoo: React.Fragment,
} as const;

const isValidAuthProviderId = (
  provider: string,
): provider is AuthProviderId => {
  return provider in ProviderIcons;
};

const isAuthProviderIdArray = (
  providers: string[],
): providers is AuthProviderId[] => {
  return providers.every(isValidAuthProviderId);
};

const AuthProviderButton = ({
  providerId,
  onClick,
  ...buttonProps
}: { providerId: AuthProviderId; onClick?: () => void } & ButtonProps) => {
  const IconRenderer = ProviderIcons[providerId];
  return (
    <Button
      variant="outline"
      className="gap-2"
      onClick={onClick}
      {...buttonProps}
    >
      <IconRenderer className="w-4 h-4 fill-foreground" />
      {AUTH_PROVIDER_NAMES[providerId]}
    </Button>
  );
};

type FormFields = {
  email: string;
  password: string;
};

const EmailPasswordForm = ({
  form,
  onSubmit,
  submitLabel,
  isPending,
}: {
  form: ReturnType<typeof useForm<FormFields>>;
  onSubmit: (data: FormFields) => void;
  submitLabel: string;
  isPending: boolean;
}) => {
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-2"
      >
        <FormItem>
          <FormLabel>E-Mail</FormLabel>
          <FormControl>
            <Input placeholder="Email" {...form.register("email")} />
          </FormControl>
          <FormMessage />
        </FormItem>
        <FormItem>
          <FormLabel>Password</FormLabel>
          <FormControl>
            <Input
              placeholder="Password"
              {...form.register("password")}
              type="password"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
        <ActionButton type="submit" isPending={isPending}>
          {submitLabel}
        </ActionButton>
      </form>
    </Form>
  );
};

export const ZudokuSignInUi = ({
  providers,
  onOAuthSignIn,
  onUsernamePasswordSignIn,
  enableUsernamePassword,
}: {
  providers: string[];
  enableUsernamePassword: boolean;
  onOAuthSignIn: (providerId: string) => Promise<void>;
  onUsernamePasswordSignIn: (email: string, password: string) => Promise<void>;
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");

  const relativeRedirectTo = getRelativeRedirectUrl(redirectTo);

  const invalidProviders = providers.filter(
    (provider) => !isValidAuthProviderId(provider),
  );

  if (invalidProviders.length > 0) {
    throw new Error(
      `Unsupported auth provider: ${invalidProviders.join(", ")}`,
    );
  }

  if (!isAuthProviderIdArray(providers)) {
    throw new Error(`Unsupported auth provider: ${providers.join(", ")}`);
  }

  const signInUsernameMutation = useMutation({
    mutationFn: async ({ email, password }: FormFields) => {
      await onUsernamePasswordSignIn(email, password);
    },
    onSuccess: () => {
      void navigate(relativeRedirectTo);
    },
  });
  const signInByProviderMutation = useMutation({
    mutationFn: async ({ providerId }: { providerId: string }) => {
      await onOAuthSignIn(providerId);
    },
    onSuccess: () => {
      void navigate(relativeRedirectTo);
    },
  });

  const form = useForm<FormFields>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const pending =
    signInUsernameMutation.isPending || signInByProviderMutation.isPending;

  const error = signInUsernameMutation.error ?? signInByProviderMutation.error;

  return (
    <AuthCard>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Sign in to your account to continue.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error?.message}</AlertDescription>
          </Alert>
        )}
        {enableUsernamePassword && (
          <>
            <EmailPasswordForm
              form={form}
              onSubmit={(data) =>
                void signInUsernameMutation.mutate({
                  email: data.email,
                  password: data.password,
                })
              }
              submitLabel="Sign in"
              isPending={pending}
            />
            <Link
              to="/reset-password"
              className="text-sm text-muted-foreground text-right -mt-2"
            >
              Forgot password?
            </Link>
          </>
        )}
        {enableUsernamePassword && providers.length > 0 && (
          <ProviderSeparator providers={providers} />
        )}
        {providers.length > 0 && (
          <ProviderButtons
            providers={providers}
            onClick={(providerId) =>
              signInByProviderMutation.mutate({ providerId })
            }
          />
        )}
        <Link to="/signup" className="text-sm text-muted-foreground">
          Don't have an account? Sign up.
        </Link>
      </CardContent>
    </AuthCard>
  );
};

export const ZudokuSignUpUi = ({
  providers,
  enableUsernamePassword,
  onOAuthSignUp,
  onUsernamePasswordSignUp,
}: {
  providers: string[];
  enableUsernamePassword: boolean;
  onOAuthSignUp: (providerId: string) => Promise<void>;
  onUsernamePasswordSignUp: (email: string, password: string) => Promise<void>;
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");

  const relativeRedirectTo = redirectTo?.replace(window.location.origin, "");

  if (!isAuthProviderIdArray(providers)) {
    throw new Error("Invalid auth provider IDs");
  }

  const signUpUsernameMutation = useMutation({
    mutationFn: async ({ email, password }: FormFields) => {
      await onUsernamePasswordSignUp(email, password);
    },
    onSuccess: () => {
      void navigate(relativeRedirectTo ?? "/");
    },
  });

  const signUpByProviderMutation = useMutation({
    mutationFn: async ({ providerId }: { providerId: string }) => {
      await onOAuthSignUp(providerId);
    },
    onSuccess: () => {
      void navigate(relativeRedirectTo ?? "/");
    },
  });

  const form = useForm<FormFields>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const pending =
    signUpUsernameMutation.isPending || signUpByProviderMutation.isPending;

  const error = signUpUsernameMutation.error ?? signUpByProviderMutation.error;

  return (
    <AuthCard>
      <CardHeader>
        <CardTitle>Sign up</CardTitle>
        <CardDescription>Sign up to your account to continue.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error?.message}</AlertDescription>
          </Alert>
        )}

        {enableUsernamePassword && (
          <EmailPasswordForm
            form={form}
            onSubmit={(data) =>
              void signUpUsernameMutation.mutate({
                email: data.email,
                password: data.password,
              })
            }
            submitLabel="Sign up"
            isPending={pending}
          />
        )}
        {enableUsernamePassword && providers.length > 0 && (
          <ProviderSeparator providers={providers} />
        )}
        {providers.length > 0 && (
          <ProviderButtons
            providers={providers}
            onClick={(providerId) =>
              signUpByProviderMutation.mutate({ providerId })
            }
          />
        )}
        <Link to="/signin" className="text-sm text-muted-foreground">
          Already have an account? Sign in.
        </Link>
      </CardContent>
    </AuthCard>
  );
};

const AuthCard = createVariantComponent(Card, "max-w-md w-full mt-10 mx-auto");

const ProviderButtons = ({
  providers,
  onClick,
}: {
  providers: AuthProviderId[];
  onClick: (providerId: string) => void;
}) => {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-2",
        providers.length % 2 === 0 ? "grid-cols-2" : "grid-cols-1",
      )}
    >
      {providers.map((provider) => (
        <AuthProviderButton
          key={provider}
          providerId={provider}
          onClick={() => onClick(provider)}
        />
      ))}
    </div>
  );
};

const ProviderSeparator = ({ providers }: { providers: AuthProviderId[] }) => {
  return (
    providers.length > 0 && (
      <Separator className="my-3 relative">
        <span className="bg-card text-muted-foreground text-sm px-2 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          or continue with
        </span>
      </Separator>
    )
  );
};

export const ZudokuPasswordResetUi = ({
  onPasswordReset,
}: {
  onPasswordReset: (email: string) => Promise<void>;
}) => {
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const passwordResetMutation = useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      await onPasswordReset(email);
    },
    onSuccess: () => {
      setIsSubmitted(true);
    },
  });

  const form = useForm<{ email: string }>({
    defaultValues: {
      email: "",
    },
  });

  const error = passwordResetMutation.error;

  return (
    <AuthCard>
      <CardHeader>
        <CardTitle>Reset password</CardTitle>
        <CardDescription>
          {isSubmitted
            ? "Check your email for a password reset link."
            : "Enter your email address and we'll send you a link to reset your password."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error?.message}</AlertDescription>
          </Alert>
        )}
        {isSubmitted ? (
          <div className="flex flex-col gap-4">
            <Alert>
              <AlertTitle>Email sent</AlertTitle>
              <AlertDescription>
                If an account exists with that email address, you will receive a
                password reset link shortly.
              </AlertDescription>
            </Alert>
            <Link to="/signin">
              <Button variant="outline" className="w-full">
                Back to sign in
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((data) =>
                  passwordResetMutation.mutate({ email: data.email }),
                )}
                className="flex flex-col gap-2"
              >
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="you@example.com"
                      {...form.register("email")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
                <ActionButton
                  type="submit"
                  isPending={passwordResetMutation.isPending}
                >
                  Reset password
                </ActionButton>
              </form>
            </Form>
            <Link to="/signin" className="text-sm text-muted-foreground">
              Sign in
            </Link>
          </>
        )}
      </CardContent>
    </AuthCard>
  );
};
